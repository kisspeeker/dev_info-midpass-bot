import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { TelegramService } from 'src/telegram/telegram.service';
import { UsersModule } from 'src/users/users.module';
import { OrdersModule } from 'src/orders/orders.module';
import { MessageModule } from 'src/message/message.module';
import { BotModule } from 'src/bot/bot.module';
import { AutoupdateModule } from 'src/autoupdate/autoupdate.module';
import { TelegramAdminService } from 'src/telegram/telegram-admin.service';
import { TelegramUserService } from 'src/telegram/telegram-user.service';

@Module({
  imports: [
    BotModule,
    UsersModule,
    OrdersModule,
    MessageModule,
    AutoupdateModule,
    HttpModule,
  ],
  providers: [TelegramService, TelegramAdminService, TelegramUserService],
})
export class TelegramModule {}
