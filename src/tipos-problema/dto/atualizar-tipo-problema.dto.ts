import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class AtualizarTipoProblemaDto {
  @IsOptional()
  @IsString({ message: 'O nome deve ser um texto' })
  @MaxLength(191, { message: 'O nome deve ter no máximo 191 caracteres' })
  nome?: string;

  @IsOptional()
  @IsBoolean({ message: 'ativo deve ser verdadeiro ou falso' })
  ativo?: boolean;
}
