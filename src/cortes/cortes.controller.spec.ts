import { Test, TestingModule } from '@nestjs/testing';
import { CortesController } from './cortes.controller';

describe('CortesController', () => {
  let controller: CortesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CortesController],
    }).compile();

    controller = module.get<CortesController>(CortesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
