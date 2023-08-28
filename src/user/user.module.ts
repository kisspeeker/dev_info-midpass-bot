import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { OrderService } from 'src/order/order.service';

@Module({
  providers: [UserService, OrderService],
})
export class UserModule {}
