import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { TelegramService } from 'src/telegram/telegram.service';
import { UsersService } from 'src/users/users.service';
import { UsersModule } from 'src/users/users.module';
import { OrdersModule } from 'src/orders/orders.module';
import { OrdersService } from 'src/orders/orders.service';

@Module({
  imports: [UsersModule, OrdersModule, HttpModule],
  providers: [TelegramService, UsersService, OrdersService],
})
export class TelegramModule {}
