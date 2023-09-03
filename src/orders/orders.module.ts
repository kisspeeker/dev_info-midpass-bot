import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { OrdersService } from 'src/orders/orders.service';
import { Order } from 'src/orders/entity/order.entity';
import { OrderAuditLog } from 'src/orders/entity/order-audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderAuditLog]), HttpModule],
  providers: [OrdersService],
  exports: [TypeOrmModule, OrdersService],
})
export class OrdersModule {}
