import { Test, TestingModule } from '@nestjs/testing';
import { PortalCiudadanoController } from './portal-ciudadano.controller';

describe('PortalCiudadanoController', () => {
  let controller: PortalCiudadanoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortalCiudadanoController],
    }).compile();

    controller = module.get<PortalCiudadanoController>(PortalCiudadanoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
