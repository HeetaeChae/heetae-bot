import { Test, TestingModule } from '@nestjs/testing';
import { AgodaService } from './agoda.service';

describe('AgodaService', () => {
  let service: AgodaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgodaService],
    }).compile();

    service = module.get<AgodaService>(AgodaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
