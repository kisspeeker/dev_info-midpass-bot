import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { resolve } from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

import {
  API_ROUTE_MIDPASS_PROXIES,
  CODE_UID_SHORT_LENGTH,
  FALSY_PASSPORT_STATUSES,
  USER_MAX_COUNT_CODES,
} from 'src/constants';
import { LogsTypes } from 'src/enums';
import { LoggerService } from 'src/logger/logger.service';
import { CreateOrderDto } from 'src/orders/dto/create-order.dto';
import { UpdateOrderDto } from 'src/orders/dto/update-order.dto';
import { User } from 'src/users/entity/user.entity';
import { Order } from 'src/orders/entity/order.entity';
import { OrderAuditLog } from 'src/orders/entity/order-audit-log.entity';
import { CustomI18nService } from 'src/i18n/custom-i18n.service';

@Injectable()
export class OrdersService {
  private proxyIndex = 0;

  constructor(
    @InjectRepository(OrderAuditLog)
    private ordersAuditLogRepository: Repository<OrderAuditLog>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private readonly logger: LoggerService,
    private readonly i18n: CustomI18nService,
    private readonly httpService: HttpService,
  ) {}

  static isValidUid(uid = '') {
    return uid && String(uid).length === 25;
  }

  static isValidUidShort(shortUid = '') {
    return shortUid && String(shortUid).length === CODE_UID_SHORT_LENGTH + 1;
  }

  static isCompleteOrder(order: Order) {
    return (
      order.statusPercent === 0 &&
      FALSY_PASSPORT_STATUSES.includes(order.statusInternalName.toLowerCase())
    );
  }

  static parseReceptionDateFromUid(uid = '') {
    try {
      const [, , year, month, day] = String(uid).match(
        /^(\d{9})(\d{4})(\d{2})(\d{2})/,
      );
      return `${year}-${month}-${day}`;
    } catch (e) {
      console.error(e);
    }
  }

  static hasChangesWith(currentOrder: Order, newOrder: UpdateOrderDto) {
    return (
      currentOrder.statusPercent !== newOrder.internalStatus.percent ||
      currentOrder.statusName !== newOrder.passportStatus.name ||
      currentOrder.statusInternalName !== newOrder.internalStatus.name
    );
  }

  static getLocaleOrderUpdateTime(order: Order) {
    return new Date(order.updatedAt).toLocaleString('ru-RU', {
      timeStyle: 'medium',
      dateStyle: 'short',
      timeZone: 'Europe/Moscow',
    });
  }

  static async getStatusImage(order: Order) {
    const statusImagePath = resolve(
      `./public/images/${order.statusPercent}.png`,
    );
    if (fs.existsSync(statusImagePath)) {
      return fs.createReadStream(statusImagePath);
    }
    return fs.createReadStream(resolve('./public/images/0.png'));
  }

  private async getStatusFromMidpass(
    order: Order,
  ): Promise<{ updateOrderDto: UpdateOrderDto; proxy: string }> {
    try {
      if (!API_ROUTE_MIDPASS_PROXIES[this.proxyIndex]) {
        this.proxyIndex = 0;
      }
      const proxy = API_ROUTE_MIDPASS_PROXIES[this.proxyIndex];

      const updateOrderDto = (
        await firstValueFrom(this.httpService.get(`${proxy}/${order.uid}`))
      ).data;

      this.proxyIndex++;

      if (!updateOrderDto) {
        this.logger.error(LogsTypes.ErrorOrderRequest, order.uid, { order });
        throw LogsTypes.ErrorOrderRequest;
      }
      return {
        updateOrderDto,
        proxy,
      };
    } catch (error) {
      this.logger.error(LogsTypes.ErrorOrderRequest, order.uid, { order });
    }
  }

  getLocaleOrderStatus(order: Order) {
    return (
      (order.statusName ? '' : this.i18n.t('order_empty')) +
      this.i18n.t('order_status_beauty', {
        order,
        updateTime: OrdersService.getLocaleOrderUpdateTime(order),
      })
    );
  }

  async create(createOrderDto: CreateOrderDto, user: User) {
    if (
      user.orders.filter((order) => !order.isDeleted).length >=
      USER_MAX_COUNT_CODES
    ) {
      this.logger.error(LogsTypes.ErrorUserOrdersMaxCount, createOrderDto.uid, {
        user,
      });
      return null;
    }

    const existingOrder = await this.ordersRepository.findOneBy({
      uid: createOrderDto.uid,
      isDeleted: false,
    });

    if (existingOrder && existingOrder.userId !== user.id) {
      this.logger.error(
        LogsTypes.ErrorUserNotAllowedToUpdateOrder,
        createOrderDto.uid,
        { user },
      );
      return null;
    }

    const newOrder = this.ordersRepository.create({
      uid: String(createOrderDto.uid),
      shortUid: `*${createOrderDto.uid.slice(-CODE_UID_SHORT_LENGTH)}`,
      receptionDate: OrdersService.parseReceptionDateFromUid(
        createOrderDto.uid,
      ),
      isDeleted: false,
      user,
    });

    await this.ordersRepository.save(newOrder);

    this.logger.log(LogsTypes.DbOrderCreated, newOrder.uid, {
      order: newOrder,
    });
    await this.createAuditLog(newOrder, user);

    return newOrder;
  }

  async createAuditLog(newOrder: Order, user: User, oldOrder?: Order) {
    const auditLog = this.ordersAuditLogRepository.create({
      orderUid: newOrder.uid,
      userId: user.id,
      oldStatusId: oldOrder?.statusId,
      newStatusId: newOrder.statusId,
      oldStatusName: oldOrder?.statusName,
      newStatusName: newOrder.statusName,
      oldStatusInternalName: oldOrder?.statusInternalName,
      newStatusInternalName: newOrder.statusInternalName,
      oldStatusPercent: oldOrder?.statusPercent,
      newStatusPercent: newOrder.statusPercent,
      isDeleted: newOrder.isDeleted,
    });

    const res = await this.ordersAuditLogRepository.save(auditLog);
    this.logger.log(LogsTypes.DbOrderAuditCreated, res.id);
  }

  async update(existingOrder: Order, user: User) {
    const oldOrder = JSON.parse(JSON.stringify(existingOrder)) as Order;
    const midpassResult = await this.getStatusFromMidpass(existingOrder);
    const updateOrderDto = midpassResult.updateOrderDto;

    (existingOrder.sourceUid = updateOrderDto.sourceUid),
      (existingOrder.receptionDate = updateOrderDto.receptionDate),
      (existingOrder.statusId = updateOrderDto.passportStatus.passportStatusId),
      (existingOrder.statusName = updateOrderDto.passportStatus.name),
      (existingOrder.statusDescription =
        updateOrderDto.passportStatus.description),
      (existingOrder.statusColor = updateOrderDto.passportStatus.color),
      (existingOrder.statusSubscription =
        updateOrderDto.passportStatus.subscription),
      (existingOrder.statusInternalName = updateOrderDto.internalStatus.name),
      (existingOrder.statusPercent = updateOrderDto.internalStatus.percent),
      (existingOrder.isDeleted = false),
      await this.ordersRepository.save(existingOrder);

    this.logger.log(LogsTypes.DbOrderUpdated, existingOrder.uid, {
      order: existingOrder,
    });
    await this.createAuditLog(existingOrder, user, oldOrder);

    return {
      order: existingOrder,
      proxy: midpassResult.proxy,
    };
  }

  async delete(uid: string, user: User) {
    const existingOrder = await this.ordersRepository.findOneBy({
      uid,
    });

    if (existingOrder) {
      if (existingOrder.userId !== user.id) {
        this.logger.error(LogsTypes.ErrorUserNotAllowedToUpdateOrder, uid, {
          user,
        });
        return null;
      }

      existingOrder.isDeleted = true;
      await this.ordersRepository.save(existingOrder);

      this.logger.log(LogsTypes.DbOrderDeleted, existingOrder.uid, { user });
      await this.createAuditLog(existingOrder, user);

      return existingOrder;
    } else {
      this.logger.error(LogsTypes.ErrorOrderNotFound, uid, { user });
      return null;
    }
  }

  async deleteAll(user: User) {
    const existingOrders = await this.ordersRepository.findBy({
      userId: user.id,
    });

    if (Array.isArray(existingOrders) && existingOrders.length) {
      existingOrders.forEach((order) => {
        order.isDeleted = true;
      });

      await this.ordersRepository.save(existingOrders);

      for (const order of existingOrders) {
        this.logger.log(LogsTypes.DbOrderDeleted, order.uid, { user });
        await this.createAuditLog(order, user);
      }

      return existingOrders;
    } else {
      this.logger.error(LogsTypes.ErrorOrdersNotFound, user.id);
      return null;
    }
  }
}
