import { Test, TestingModule } from '@nestjs/testing';
import { CategoriasTarifaService } from './categorias-tarifa.service';

describe('CategoriasTarifaService', () => {
  let service: CategoriasTarifaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoriasTarifaService],
    }).compile();

    service = module.get<CategoriasTarifaService>(CategoriasTarifaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
