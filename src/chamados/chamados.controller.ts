import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ChamadosService } from './chamados.service.js';
import { AbrirChamadoDto } from './dto/abrir-chamado.dto.js';
import { DesignarTecnicoDto } from './dto/designar-tecnico.dto.js';
import { MudarSituacaoDto } from './dto/mudar-situacao.dto.js';
import { FiltrarChamadosDto } from './dto/filtrar-chamados.dto.js';

@Controller('chamados')
export class ChamadosController {
  constructor(private readonly chamadosService: ChamadosService) {}

  @Post()
  abrir(@Body() dto: AbrirChamadoDto) {
    return this.chamadosService.abrir(dto);
  }

  @Get()
  listar(@Query() filtros: FiltrarChamadosDto) {
    return this.chamadosService.listar(filtros);
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.chamadosService.buscar(id);
  }

  @Patch(':id/tecnico')
  designarTecnico(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DesignarTecnicoDto,
  ) {
    return this.chamadosService.designarTecnico(id, dto);
  }

  @Patch(':id/situacao')
  mudarSituacao(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MudarSituacaoDto,
  ) {
    return this.chamadosService.mudarSituacao(id, dto.situacao);
  }
}
