import { IsEnum } from 'class-validator';
import { SituacaoChamado } from '../../generated/prisma/enums.js';

export class MudarSituacaoDto {
  @IsEnum(SituacaoChamado, {
    message:
      'A situação deve ser ABERTO, EM_ATENDIMENTO, RESOLVIDO, FECHADO ou CANCELADO',
  })
  situacao: SituacaoChamado;
}
