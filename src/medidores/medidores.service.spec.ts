import { Test, TestingModule } from '@nestjs/testing';
import { MedidoresService } from './medidores.service';

describe('MedidoresService', () => {
  let service: MedidoresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MedidoresService],
    }).compile();

    service = module.get<MedidoresService>(MedidoresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
