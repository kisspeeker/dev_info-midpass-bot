import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrdersService } from 'src/order/order.service';
import { Order } from 'src/order/entity/order.entity';
import { OrderAuditLog } from 'src/order/entity/order-audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderAuditLog])],
  providers: [OrdersService],
  exports: [TypeOrmModule],
})
export class Ordersmodule {}
