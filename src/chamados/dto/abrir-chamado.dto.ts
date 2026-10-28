import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';
import { Prioridade } from '../../generated/prisma/enums.js';

export class AbrirChamadoDto {
  // Regra 10: título entre 5 e 100 caracteres.
  @IsString({ message: 'O título deve ser um texto' })
  @Length(5, 100, { message: 'O título deve ter entre 5 e 100 caracteres' })
  titulo: string;

  // Regra 10: descrição com no mínimo 10 caracteres.
  @IsString({ message: 'A descrição deve ser um texto' })
  @MinLength(10, { message: 'A descrição deve ter no mínimo 10 caracteres' })
  descricao: string;

  // Regra 11: prioridade opcional; quando ausente, assume MEDIA (no schema).
  @IsOptional()
  @IsEnum(Prioridade, {
    message: 'A prioridade deve ser BAIXA, MEDIA, ALTA ou CRITICA',
  })
  prioridade?: Prioridade;

  @IsInt({ message: 'solicitanteId deve ser um número inteiro' })
  solicitanteId: number;

  @IsInt({ message: 'tipoProblemaId deve ser um número inteiro' })
  tipoProblemaId: number;
}
