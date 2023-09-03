import { Test, TestingModule } from '@nestjs/testing';
import { AppResponseService } from './app-response.service';

describe('ResponseService', () => {
  let service: AppResponseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppResponseService],
    }).compile();

    service = module.get<AppResponseService>(AppResponseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
