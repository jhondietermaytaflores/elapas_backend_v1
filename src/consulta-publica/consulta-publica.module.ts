import { Module } from '@nestjs/common';
import { ConsultaPublicaController } from './consulta-publica.controller';
import { ConsultaPublicaService } from './consulta-publica.service';

@Module({
  controllers: [ConsultaPublicaController],
  providers: [ConsultaPublicaService],
  exports: [ConsultaPublicaService],
})
export class ConsultaPublicaModule {}