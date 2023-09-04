import { Global, Module } from '@nestjs/common';
import { AppResponseService } from 'src/app-response/app-response.service';
import { NotificationModule } from 'src/notification/notification.module';

@Global()
@Module({
  imports: [NotificationModule],
  providers: [AppResponseService],
  exports: [AppResponseService],
})
export class AppResponseModule {}
