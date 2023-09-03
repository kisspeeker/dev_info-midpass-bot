import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { KeyboardModule } from 'src/keyboard/keyboard.module';
import { BotModule } from 'src/bot/bot.module';

@Module({
  imports: [BotModule, KeyboardModule],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
