import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BotService } from './bot/bot.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const botService = app.get(BotService);
  await botService.startBot();
  app.init();
}
bootstrap();
