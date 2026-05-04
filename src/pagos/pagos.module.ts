import { Module } from '@nestjs/common';
import { PagosController } from './pagos.controller';
import { PagosService } from './pagos.service';
import { AuditoriasModule } from '../auditorias/auditorias.module';

@Module({
  imports: [AuditoriasModule],
  controllers: [PagosController],
  providers: [PagosService],
  exports: [PagosService],
})
export class PagosModule {}