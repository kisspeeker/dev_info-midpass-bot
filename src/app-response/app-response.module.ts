import { Module } from '@nestjs/common';
import { AppResponseService } from 'src/app-response/app-response.service';

@Module({
  providers: [AppResponseService],
  exports: [AppResponseService],
})
export class AppResponseModule {}
