import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { OrdersService } from 'src/orders/orders.service';
import { Order } from 'src/orders/entity/order.entity';
import { OrderAudit } from 'src/orders/entity/order-audit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderAudit]), HttpModule],
  providers: [OrdersService],
  exports: [TypeOrmModule, OrdersService],
})
export class OrdersModule {}
