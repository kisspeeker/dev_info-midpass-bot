import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { OrderAudit } from 'src/orders/entity/order-audit.entity';
import { LoggerService } from 'src/logger/logger.service';
import { Order } from 'src/orders/entity/order.entity';
import { filterOrder } from 'src/constants/filters';
import { FindOrderParams } from 'src/types/filter-types';

@Injectable()
export class OrdersAuditService {
  constructor(
    @InjectRepository(OrderAudit)
    private ordersAuditLogRepository: Repository<OrderAudit>,
  ) {}

  async find({ uid }: FindOrderParams) {
    try {
      return this.ordersAuditLogRepository.find({
        where: filterOrder({ uid }),
      });
    } catch (err) {
      throw err;
    }
  }
}
