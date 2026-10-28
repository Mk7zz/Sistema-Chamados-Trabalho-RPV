import { IsEmail, IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { TipoPessoa } from '../../generated/prisma/enums.js';

export class CriarPessoaDto {
  @IsString({ message: 'O nome deve ser um texto' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @MaxLength(191, { message: 'O nome deve ter no máximo 191 caracteres' })
  nome: string;

  @IsEmail({}, { message: 'O e-mail deve ter um formato válido' })
  @MaxLength(191, { message: 'O e-mail deve ter no máximo 191 caracteres' })
  email: string;

  @IsEnum(TipoPessoa, { message: 'O tipo deve ser SOLICITANTE ou TECNICO' })
  tipo: TipoPessoa;
}
