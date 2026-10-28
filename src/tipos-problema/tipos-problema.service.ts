import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CriarTipoProblemaDto } from './dto/criar-tipo-problema.dto.js';
import { AtualizarTipoProblemaDto } from './dto/atualizar-tipo-problema.dto.js';

@Injectable()
export class TiposProblemaService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dto: CriarTipoProblemaDto) {
    // Regra 5: o nome não pode se repetir.
    const existente = await this.prisma.tipoProblema.findUnique({
      where: { nome: dto.nome },
    });
    if (existente) {
      throw new ConflictException(
        `Já existe um tipo de problema com o nome "${dto.nome}"`,
      );
    }
    return this.prisma.tipoProblema.create({ data: dto });
  }

  listar() {
    return this.prisma.tipoProblema.findMany({ orderBy: { id: 'asc' } });
  }

  async buscar(id: number) {
    const tipo = await this.prisma.tipoProblema.findUnique({ where: { id } });
    if (!tipo) throw new NotFoundException(`Tipo de problema ${id} não encontrado`);
    return tipo;
  }

  async atualizar(id: number, dto: AtualizarTipoProblemaDto) {
    await this.buscar(id);

    // Regra 5: ao renomear, o novo nome também não pode colidir.
    if (dto.nome) {
      const outro = await this.prisma.tipoProblema.findUnique({
        where: { nome: dto.nome },
      });
      if (outro && outro.id !== id) {
        throw new ConflictException(
          `Já existe um tipo de problema com o nome "${dto.nome}"`,
        );
      }
    }

    return this.prisma.tipoProblema.update({ where: { id }, data: dto });
  }

  async remover(id: number) {
    await this.buscar(id);

    // Regra 7: um tipo já usado em algum chamado não pode ser removido,
    // apenas desativado.
    const usos = await this.prisma.chamado.count({
      where: { tipoProblemaId: id },
    });
    if (usos > 0) {
      throw new ConflictException(
        `Tipo de problema ${id} já foi usado em chamados e não pode ser removido. Desative-o (PATCH com { "ativo": false }).`,
      );
    }

    return this.prisma.tipoProblema.delete({ where: { id } });
  }
}
