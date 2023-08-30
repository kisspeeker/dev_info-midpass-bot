import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersService } from 'src/user/user.service';
import { User } from 'src/user/entity/user.entity';
import { Ordersmodule } from 'src/order/order.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), Ordersmodule],
  providers: [UsersService],
  exports: [TypeOrmModule],
})
export class Usersmodule {}
