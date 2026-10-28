import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CriarPessoaDto } from './dto/criar-pessoa.dto.js';
import { AtualizarPessoaDto } from './dto/atualizar-pessoa.dto.js';

@Injectable()
export class PessoasService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dto: CriarPessoaDto) {
    const existente = await this.prisma.pessoa.findUnique({
      where: { email: dto.email },
    });
    // Regra 1: o e-mail não pode se repetir.
    if (existente) {
      throw new ConflictException(`Já existe uma pessoa com o e-mail ${dto.email}`);
    }
    return this.prisma.pessoa.create({ data: dto });
  }

  listar() {
    return this.prisma.pessoa.findMany({ orderBy: { id: 'asc' } });
  }

  async buscar(id: number) {
    const pessoa = await this.prisma.pessoa.findUnique({ where: { id } });
    if (!pessoa) throw new NotFoundException(`Pessoa ${id} não encontrada`);
    return pessoa;
  }

  async atualizar(id: number, dto: AtualizarPessoaDto) {
    await this.buscar(id);
    return this.prisma.pessoa.update({ where: { id }, data: dto });
  }

  async remover(id: number) {
    await this.buscar(id);

    // Regra 4: quem já esteve envolvido com algum chamado não pode ser
    // removido, apenas desativado.
    const envolvimentos = await this.prisma.chamado.count({
      where: {
        OR: [{ solicitanteId: id }, { tecnicoId: id }],
      },
    });
    const comentarios = await this.prisma.comentario.count({
      where: { autorId: id },
    });

    if (envolvimentos > 0 || comentarios > 0) {
      throw new ConflictException(
        `Pessoa ${id} já esteve envolvida em chamados e não pode ser removida. Desative-a (PATCH com { "ativo": false }).`,
      );
    }

    return this.prisma.pessoa.delete({ where: { id } });
  }
}
