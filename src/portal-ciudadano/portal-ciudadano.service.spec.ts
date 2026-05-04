import { Test, TestingModule } from '@nestjs/testing';
import { PortalCiudadanoService } from './portal-ciudadano.service';

describe('PortalCiudadanoService', () => {
  let service: PortalCiudadanoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PortalCiudadanoService],
    }).compile();

    service = module.get<PortalCiudadanoService>(PortalCiudadanoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
