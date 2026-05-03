import { Test, TestingModule } from '@nestjs/testing';
import { CiudadanosController } from './ciudadanos.controller';

describe('CiudadanosController', () => {
  let controller: CiudadanosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CiudadanosController],
    }).compile();

    controller = module.get<CiudadanosController>(CiudadanosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
