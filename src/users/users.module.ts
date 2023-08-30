import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entity/user.entity';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), OrdersModule],
  providers: [UsersService],
  exports: [TypeOrmModule],
})
export class UsersModule {}
