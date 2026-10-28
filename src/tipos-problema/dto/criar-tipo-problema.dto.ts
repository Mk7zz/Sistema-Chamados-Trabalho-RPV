import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CriarTipoProblemaDto {
  @IsString({ message: 'O nome deve ser um texto' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @MaxLength(191, { message: 'O nome deve ter no máximo 191 caracteres' })
  nome: string;
}
