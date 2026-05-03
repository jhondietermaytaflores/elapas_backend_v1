import { Test, TestingModule } from '@nestjs/testing';
import { TarifasController } from './tarifas.controller';

describe('TarifasController', () => {
  let controller: TarifasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TarifasController],
    }).compile();

    controller = module.get<TarifasController>(TarifasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
