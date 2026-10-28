import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CriarComentarioDto } from './dto/criar-comentario.dto.js';
import { SituacaoChamado } from '../generated/prisma/enums.js';

const ENCERRADOS: SituacaoChamado[] = [
  SituacaoChamado.FECHADO,
  SituacaoChamado.CANCELADO,
];

@Injectable()
export class ComentariosService {
  constructor(private readonly prisma: PrismaService) {}

  async comentar(chamadoId: number, dto: CriarComentarioDto) {
    const chamado = await this.prisma.chamado.findUnique({
      where: { id: chamadoId },
    });
    if (!chamado) {
      throw new NotFoundException(`Chamado ${chamadoId} não encontrado`);
    }

    // Regra 15: chamados encerrados não podem receber comentários.
    if (ENCERRADOS.includes(chamado.situacao)) {
      throw new ConflictException(
        'Chamado encerrado não pode receber comentários',
      );
    }

    const autor = await this.prisma.pessoa.findUnique({
      where: { id: dto.autorId },
    });
    if (!autor) {
      throw new NotFoundException(`Pessoa ${dto.autorId} não encontrada`);
    }
    // Regra 3: pessoas inativas não podem comentar.
    if (!autor.ativo) {
      throw new BadRequestException('Pessoa inativa não pode comentar');
    }

    // Regra 19: só comentam quem abriu o chamado e o técnico responsável.
    const ehSolicitante = autor.id === chamado.solicitanteId;
    const ehTecnicoResponsavel = autor.id === chamado.tecnicoId;
    if (!ehSolicitante && !ehTecnicoResponsavel) {
      throw new ForbiddenException(
        'Só o solicitante e o técnico responsável podem comentar neste chamado',
      );
    }

    // Regra 21: uma vez escrito, o comentário faz parte do histórico e não é
    // alterado nem apagado — por isso não há rotas de edição/remoção.
    return this.prisma.comentario.create({
      data: {
        chamadoId,
        autorId: dto.autorId,
        texto: dto.texto,
      },
    });
  }

  listar(chamadoId: number) {
    return this.prisma.comentario.findMany({
      where: { chamadoId },
      orderBy: { id: 'asc' },
      include: { autor: { select: { id: true, nome: true } } },
    });
  }
}
