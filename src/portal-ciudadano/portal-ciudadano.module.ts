import { Module } from '@nestjs/common';
import { PortalCiudadanoController } from './portal-ciudadano.controller';
import { PortalCiudadanoService } from './portal-ciudadano.service';

@Module({
  controllers: [PortalCiudadanoController],
  providers: [PortalCiudadanoService],
  exports: [PortalCiudadanoService],
})
export class PortalCiudadanoModule {}