import { Test, TestingModule } from '@nestjs/testing';
import { ConsultaPublicaController } from './consulta-publica.controller';

describe('ConsultaPublicaController', () => {
  let controller: ConsultaPublicaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsultaPublicaController],
    }).compile();

    controller = module.get<ConsultaPublicaController>(ConsultaPublicaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
