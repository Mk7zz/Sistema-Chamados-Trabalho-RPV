import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AbrirChamadoDto } from './dto/abrir-chamado.dto.js';
import { DesignarTecnicoDto } from './dto/designar-tecnico.dto.js';
import { FiltrarChamadosDto } from './dto/filtrar-chamados.dto.js';
import { SituacaoChamado, TipoPessoa } from '../generated/prisma/enums.js';

// Regra 14: transições permitidas entre as situações do chamado.
// A entrada em EM_ATENDIMENTO a partir de ABERTO acontece só pela designação
// de um técnico (regra 13), por isso não aparece neste mapa de troca manual.
const TRANSICOES: Record<SituacaoChamado, SituacaoChamado[]> = {
  ABERTO: [SituacaoChamado.CANCELADO],
  EM_ATENDIMENTO: [SituacaoChamado.RESOLVIDO, SituacaoChamado.CANCELADO],
  RESOLVIDO: [SituacaoChamado.FECHADO, SituacaoChamado.EM_ATENDIMENTO],
  FECHADO: [],
  CANCELADO: [],
};

const ENCERRADOS: SituacaoChamado[] = [
  SituacaoChamado.FECHADO,
  SituacaoChamado.CANCELADO,
];

const LIMITE_EM_ATENDIMENTO = 5;

@Injectable()
export class ChamadosService {
  constructor(private readonly prisma: PrismaService) {}

  async abrir(dto: AbrirChamadoDto) {
    // Regra 9: quem abre deve ser um solicitante ativo.
    const solicitante = await this.prisma.pessoa.findUnique({
      where: { id: dto.solicitanteId },
    });
    if (!solicitante) {
      throw new NotFoundException(
        `Solicitante ${dto.solicitanteId} não encontrado`,
      );
    }
    if (solicitante.tipo !== TipoPessoa.SOLICITANTE) {
      throw new BadRequestException(
        'Apenas um solicitante pode abrir chamados',
      );
    }
    // Regra 3: pessoas inativas não podem abrir chamados.
    if (!solicitante.ativo) {
      throw new BadRequestException(
        'Solicitante inativo não pode abrir chamados',
      );
    }

    // Regra 6: não é possível abrir chamado em um tipo desativado.
    const tipo = await this.prisma.tipoProblema.findUnique({
      where: { id: dto.tipoProblemaId },
    });
    if (!tipo) {
      throw new NotFoundException(
        `Tipo de problema ${dto.tipoProblemaId} não encontrado`,
      );
    }
    if (!tipo.ativo) {
      throw new BadRequestException(
        'Não é possível abrir chamado em um tipo de problema desativado',
      );
    }

    // Regras 8 e 11: nasce ABERTO, sem técnico; prioridade MEDIA por padrão.
    return this.prisma.chamado.create({
      data: {
        titulo: dto.titulo,
        descricao: dto.descricao,
        prioridade: dto.prioridade,
        solicitanteId: dto.solicitanteId,
        tipoProblemaId: dto.tipoProblemaId,
      },
    });
  }

  listar(filtros: FiltrarChamadosDto) {
    return this.prisma.chamado.findMany({
      where: {
        situacao: filtros.situacao,
        prioridade: filtros.prioridade,
        tipoProblemaId: filtros.tipoProblemaId,
        tecnicoId: filtros.tecnicoId,
      },
      orderBy: { id: 'asc' },
      include: {
        solicitante: { select: { id: true, nome: true, email: true } },
        tecnico: { select: { id: true, nome: true, email: true } },
        tipoProblema: { select: { id: true, nome: true } },
      },
    });
  }

  async buscar(id: number) {
    // Mostra o chamado com toda a sua conversa.
    const chamado = await this.prisma.chamado.findUnique({
      where: { id },
      include: {
        solicitante: { select: { id: true, nome: true, email: true } },
        tecnico: { select: { id: true, nome: true, email: true } },
        tipoProblema: { select: { id: true, nome: true } },
        comentarios: {
          orderBy: { id: 'asc' },
          include: { autor: { select: { id: true, nome: true } } },
        },
      },
    });
    if (!chamado) throw new NotFoundException(`Chamado ${id} não encontrado`);
    return chamado;
  }

  async designarTecnico(id: number, dto: DesignarTecnicoDto) {
    const chamado = await this.prisma.chamado.findUnique({ where: { id } });
    if (!chamado) throw new NotFoundException(`Chamado ${id} não encontrado`);

    // Regra 15: chamados encerrados não podem mais ser alterados.
    if (ENCERRADOS.includes(chamado.situacao)) {
      throw new ConflictException(
        'Chamado encerrado não pode receber técnico',
      );
    }

    const tecnico = await this.prisma.pessoa.findUnique({
      where: { id: dto.tecnicoId },
    });
    if (!tecnico) {
      throw new NotFoundException(`Técnico ${dto.tecnicoId} não encontrado`);
    }
    // Regra 12: apenas um técnico ativo pode ser designado.
    if (tecnico.tipo !== TipoPessoa.TECNICO) {
      throw new BadRequestException('A pessoa designada não é um técnico');
    }
    if (!tecnico.ativo) {
      throw new BadRequestException('Técnico inativo não pode ser designado');
    }

    // Regra 18: ninguém pode atender o próprio chamado.
    if (chamado.solicitanteId === tecnico.id) {
      throw new BadRequestException(
        'O solicitante não pode atender o próprio chamado',
      );
    }

    // Regra 17: um técnico não pode ter mais de 5 chamados em atendimento.
    const emAtendimento = await this.prisma.chamado.count({
      where: {
        tecnicoId: tecnico.id,
        situacao: SituacaoChamado.EM_ATENDIMENTO,
        id: { not: id },
      },
    });
    if (emAtendimento >= LIMITE_EM_ATENDIMENTO) {
      throw new ConflictException(
        `Técnico ${tecnico.id} já está com ${LIMITE_EM_ATENDIMENTO} chamados em atendimento`,
      );
    }

    // Regra 13: ao designar técnico a um chamado aberto, o atendimento começa.
    const novaSituacao =
      chamado.situacao === SituacaoChamado.ABERTO
        ? SituacaoChamado.EM_ATENDIMENTO
        : chamado.situacao;

    return this.prisma.chamado.update({
      where: { id },
      data: { tecnicoId: tecnico.id, situacao: novaSituacao },
    });
  }

  async mudarSituacao(id: number, destino: SituacaoChamado) {
    const chamado = await this.prisma.chamado.findUnique({ where: { id } });
    if (!chamado) throw new NotFoundException(`Chamado ${id} não encontrado`);

    // Regra 15: chamados encerrados estão fechados para alteração.
    if (ENCERRADOS.includes(chamado.situacao)) {
      throw new ConflictException(
        `Chamado ${chamado.situacao.toLowerCase()} não pode mais ser alterado`,
      );
    }

    if (destino === chamado.situacao) {
      throw new BadRequestException(
        `O chamado já está na situação ${destino}`,
      );
    }

    // Regra 14: só as transições previstas são permitidas.
    if (!TRANSICOES[chamado.situacao].includes(destino)) {
      throw new BadRequestException(
        `Transição de ${chamado.situacao} para ${destino} não é permitida`,
      );
    }

    // Reabrir ou resolver exige técnico responsável já designado.
    if (
      destino === SituacaoChamado.EM_ATENDIMENTO &&
      chamado.tecnicoId === null
    ) {
      throw new BadRequestException(
        'Designe um técnico para iniciar o atendimento',
      );
    }

    // Regra 16: registra o momento em que o chamado é resolvido.
    const resolvidoEm =
      destino === SituacaoChamado.RESOLVIDO ? new Date() : chamado.resolvidoEm;

    return this.prisma.chamado.update({
      where: { id },
      data: { situacao: destino, resolvidoEm },
    });
  }
}
