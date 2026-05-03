import { Module } from '@nestjs/common';
import { CategoriasTarifaController } from './categorias-tarifa.controller';
import { CategoriasTarifaService } from './categorias-tarifa.service';

@Module({
  controllers: [CategoriasTarifaController],
  providers: [CategoriasTarifaService],
  exports: [CategoriasTarifaService],
})
export class CategoriasTarifaModule {}