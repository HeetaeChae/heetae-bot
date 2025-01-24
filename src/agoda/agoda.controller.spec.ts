import { Test, TestingModule } from '@nestjs/testing';
import { AgodaController } from './agoda.controller';

describe('AgodaController', () => {
  let controller: AgodaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgodaController],
    }).compile();

    controller = module.get<AgodaController>(AgodaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
