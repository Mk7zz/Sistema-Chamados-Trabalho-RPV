import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CriarComentarioDto {
  @IsInt({ message: 'autorId deve ser um número inteiro' })
  autorId: number;

  // Regra 20: um comentário não pode ser vazio.
  @IsString({ message: 'O texto deve ser um texto' })
  @IsNotEmpty({ message: 'O comentário não pode ser vazio' })
  texto: string;
}
