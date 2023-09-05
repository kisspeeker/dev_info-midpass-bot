import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { KeyboardModule } from 'src/keyboard/keyboard.module';
import { BotModule } from 'src/bot/bot.module';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
  imports: [BotModule, KeyboardModule, OrdersModule],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
