import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { TelegramService } from 'src/telegram/telegram.service';
import { UsersModule } from 'src/users/users.module';
import { OrdersModule } from 'src/orders/orders.module';
import { MessageModule } from 'src/message/message.module';
import { BotModule } from 'src/bot/bot.module';
import { AutoupdateModule } from 'src/autoupdate/autoupdate.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    BotModule,
    UsersModule,
    OrdersModule,
    MessageModule,
    AutoupdateModule,
    NotificationModule,
    HttpModule,
  ],
  providers: [TelegramService],
})
export class TelegramModule {}
