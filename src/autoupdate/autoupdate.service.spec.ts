import { Test, TestingModule } from '@nestjs/testing';
import { AutoupdateService } from './autoupdate.service';

describe('AutoupdateService', () => {
  let service: AutoupdateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AutoupdateService],
    }).compile();

    service = module.get<AutoupdateService>(AutoupdateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
