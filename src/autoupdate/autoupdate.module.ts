import { Module } from '@nestjs/common';
import { AutoupdateService } from './autoupdate.service';
import { UsersModule } from 'src/users/users.module';
import { OrdersModule } from 'src/orders/orders.module';
import { MessageModule } from 'src/message/message.module';

@Module({
  imports: [UsersModule, OrdersModule, MessageModule],
  providers: [AutoupdateService],
  exports: [AutoupdateService],
})
export class AutoupdateModule {}
