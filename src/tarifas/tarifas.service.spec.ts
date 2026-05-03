import { Test, TestingModule } from '@nestjs/testing';
import { TarifasService } from './tarifas.service';

describe('TarifasService', () => {
  let service: TarifasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TarifasService],
    }).compile();

    service = module.get<TarifasService>(TarifasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
