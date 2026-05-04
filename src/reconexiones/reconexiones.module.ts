import { Module } from '@nestjs/common';
import { ReconexionesController } from './reconexiones.controller';
import { ReconexionesService } from './reconexiones.service';

@Module({
  controllers: [ReconexionesController],
  providers: [ReconexionesService],
  exports: [ReconexionesService],
})
export class ReconexionesModule {}