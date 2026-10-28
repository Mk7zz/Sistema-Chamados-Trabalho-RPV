import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { Prioridade, SituacaoChamado } from '../../generated/prisma/enums.js';

export class FiltrarChamadosDto {
  @IsOptional()
  @IsEnum(SituacaoChamado, {
    message:
      'situacao deve ser ABERTO, EM_ATENDIMENTO, RESOLVIDO, FECHADO ou CANCELADO',
  })
  situacao?: SituacaoChamado;

  @IsOptional()
  @IsEnum(Prioridade, {
    message: 'prioridade deve ser BAIXA, MEDIA, ALTA ou CRITICA',
  })
  prioridade?: Prioridade;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'tipoProblemaId deve ser um número inteiro' })
  tipoProblemaId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'tecnicoId deve ser um número inteiro' })
  tecnicoId?: number;
}
