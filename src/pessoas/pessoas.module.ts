import { Module } from '@nestjs/common';
import { PessoasController } from './pessoas.controller.js';
import { PessoasService } from './pessoas.service.js';

@Module({
  controllers: [PessoasController],
  providers: [PessoasService],
  exports: [PessoasService],
})
export class PessoasModule {}
