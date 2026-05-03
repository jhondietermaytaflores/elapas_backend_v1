import { Test, TestingModule } from '@nestjs/testing';
import { MedidoresController } from './medidores.controller';

describe('MedidoresController', () => {
  let controller: MedidoresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MedidoresController],
    }).compile();

    controller = module.get<MedidoresController>(MedidoresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
