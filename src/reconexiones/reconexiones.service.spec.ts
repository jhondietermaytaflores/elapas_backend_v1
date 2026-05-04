import { Test, TestingModule } from '@nestjs/testing';
import { ReconexionesService } from './reconexiones.service';

describe('ReconexionesService', () => {
  let service: ReconexionesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReconexionesService],
    }).compile();

    service = module.get<ReconexionesService>(ReconexionesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
