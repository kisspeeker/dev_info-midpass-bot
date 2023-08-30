import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { UsersService } from 'src/user/user.service';
import { Usersmodule } from 'src/user/user.module';
import { Ordersmodule } from 'src/order/order.module';
import { OrdersService } from 'src/order/order.service';

@Module({
  imports: [Usersmodule, Ordersmodule],
  providers: [TelegramService, UsersService, OrdersService],
  controllers: [TelegramController],
})
export class TelegramModule {}
