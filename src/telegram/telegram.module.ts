import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { TelegramService } from 'src/telegram/telegram.service';
import { TelegramController } from 'src/telegram/telegram.controller';
import { UsersService } from 'src/users/users.service';
import { UsersModule } from 'src/users/users.module';
import { OrdersModule } from 'src/orders/orders.module';
import { OrdersService } from 'src/orders/orders.service';

@Module({
  imports: [UsersModule, OrdersModule, HttpModule],
  providers: [TelegramService, UsersService, OrdersService],
  controllers: [TelegramController],
})
export class TelegramModule {}
