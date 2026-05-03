import { Test, TestingModule } from '@nestjs/testing';
import { CategoriasTarifaController } from './categorias-tarifa.controller';

describe('CategoriasTarifaController', () => {
  let controller: CategoriasTarifaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriasTarifaController],
    }).compile();

    controller = module.get<CategoriasTarifaController>(CategoriasTarifaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
