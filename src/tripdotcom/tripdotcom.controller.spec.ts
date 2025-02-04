import { Test, TestingModule } from '@nestjs/testing';
import { TripdotcomController } from './tripdotcom.controller';

describe('TripdotcomController', () => {
  let controller: TripdotcomController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TripdotcomController],
    }).compile();

    controller = module.get<TripdotcomController>(TripdotcomController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
