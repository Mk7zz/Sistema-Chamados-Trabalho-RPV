import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ComentariosService } from './comentarios.service.js';
import { CriarComentarioDto } from './dto/criar-comentario.dto.js';

@Controller('chamados/:chamadoId/comentarios')
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) {}

  @Post()
  comentar(
    @Param('chamadoId', ParseIntPipe) chamadoId: number,
    @Body() dto: CriarComentarioDto,
  ) {
    return this.comentariosService.comentar(chamadoId, dto);
  }

  @Get()
  listar(@Param('chamadoId', ParseIntPipe) chamadoId: number) {
    return this.comentariosService.listar(chamadoId);
  }
}
