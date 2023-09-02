import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TelegramService } from './telegram/telegram.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const telegramService = app.get(TelegramService);
  await telegramService.startBot();
  app.init();
}
bootstrap();
