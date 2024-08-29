import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order } from 'src/orders/entity/order.entity';
import { filterActive, filterOrder, filterOrderByUser } from 'src/constants/filters';
import { ApiService } from 'src/api/api.service';
import { FindUserOrderParams } from 'src/types/filter-types';
import { LogError } from 'src/logger/enums/log-error';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private readonly apiService: ApiService,
  ) {}

  static validate({ order, userId }: { order: Order; userId: Order['userId'] }) {
    if (order.userId !== userId) {
      throw LogError.ErrorUserNotAllowedToUpdateOrder;
    }

    return true;
  }

  async create({ uid, userId }: FindUserOrderParams) {
    try {
      const midpassOrder = await this.apiService.getStatusFromMidpass({ uid });
      const order = this.ordersRepository.create({ ...midpassOrder, userId });

      return this.ordersRepository.save(order);
    } catch (err) {
      throw err;
    }
  }

  async find({ uid, userId }: FindUserOrderParams) {
    try {
      const order = await this.ordersRepository.findOne({
        where: filterOrder({ uid }),
      });

      if (!order) {
        return this.create({ uid, userId });
      }

      return OrdersService.validate({ order, userId }) && order;
    } catch (err) {
      throw err;
    }
  }

  async update({ uid, userId }: FindUserOrderParams) {
    try {
      const [existOrder, midpassOrder] = await Promise.all([
        this.find({ uid, userId }),
        this.apiService.getStatusFromMidpass({ uid }),
      ]);

      const order = this.ordersRepository.merge(existOrder, midpassOrder);

      return this.ordersRepository.save(order);
    } catch (err) {
      return err;
    }
  }

  async findAll() {
    try {
      return this.ordersRepository.find();
    } catch (err) {
      throw err;
    }
  }

  async findAllActive() {
    try {
      return this.ordersRepository.find({
        where: filterActive(),
      });
    } catch (err) {
      throw err;
    }
  }

  async delete({ uid, userId }: FindUserOrderParams) {
    try {
      const order = await this.ordersRepository.findOne({
        where: filterOrder({ uid, userId }),
      });

      order.isDeleted = true;
      
      return this.ordersRepository.save(order);
    } catch (err) {
      throw err;
    }
  }

  async deleteAll(userId: Order['userId']) {
    try {
      const orders = await this.ordersRepository.find({
        where: filterOrderByUser({ userId }),
      });

      for (const order of orders) {
        order.isDeleted = true;
      }

      return this.ordersRepository.save(orders);
    } catch (err) {
      throw err;
    }
  }
}
