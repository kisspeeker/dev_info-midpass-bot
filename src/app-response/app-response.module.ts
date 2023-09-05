import { Global, Module } from '@nestjs/common';
import { AppResponseService } from 'src/app-response/app-response.service';
import { BotModule } from 'src/bot/bot.module';

@Global()
@Module({
  imports: [BotModule],
  providers: [AppResponseService],
  exports: [AppResponseService],
})
export class AppResponseModule {}
