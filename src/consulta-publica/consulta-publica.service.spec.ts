import { Test, TestingModule } from '@nestjs/testing';
import { ConsultaPublicaService } from './consulta-publica.service';

describe('ConsultaPublicaService', () => {
  let service: ConsultaPublicaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsultaPublicaService],
    }).compile();

    service = module.get<ConsultaPublicaService>(ConsultaPublicaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
