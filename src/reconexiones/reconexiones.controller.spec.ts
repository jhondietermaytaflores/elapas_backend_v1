import { Test, TestingModule } from '@nestjs/testing';
import { ReconexionesController } from './reconexiones.controller';

describe('ReconexionesController', () => {
  let controller: ReconexionesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReconexionesController],
    }).compile();

    controller = module.get<ReconexionesController>(ReconexionesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
