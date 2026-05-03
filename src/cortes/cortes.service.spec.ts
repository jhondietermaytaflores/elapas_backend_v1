import { Test, TestingModule } from '@nestjs/testing';
import { CortesService } from './cortes.service';

describe('CortesService', () => {
  let service: CortesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CortesService],
    }).compile();

    service = module.get<CortesService>(CortesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
