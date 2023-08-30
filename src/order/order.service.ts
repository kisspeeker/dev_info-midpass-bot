import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  CODE_UID_SHORT_LENGTH,
  FALSY_PASSPORT_STATUSES,
  USER_MAX_COUNT_CODES,
} from 'src/constants';
import { LoggerService } from 'src/logger/logger.service';
import { LogsTypes } from 'src/enums';
import { CreateOrderDto } from 'src/order/dto/create-order.dto';
import { UpdateOrderDto } from 'src/order/dto/update-order.dto';
import { User } from 'src/user/entity/user.entity';
import { Order } from 'src/order/entity/order.entity';
import { OrderAuditLog } from 'src/order/entity/order-audit-log.entity';
import { CustomI18nService } from 'src/i18n/custom-i18n.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderAuditLog)
    private ordersAuditLogRepository: Repository<OrderAuditLog>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private readonly logger: LoggerService,
    private readonly i18n: CustomI18nService,
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
      this.logger.error(
        LogsTypes.ErrorUserHasMaxCountCodes,
        createOrderDto.uid,
        user,
      );
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
        user,
      );
      return null;
    }

    const newOrder = this.ordersRepository.create({
      uid: String(createOrderDto.uid),
      receptionDate: OrdersService.parseReceptionDateFromUid(
        createOrderDto.uid,
      ),
      isDeleted: false,
      user,
    });

    await this.createAuditLog(newOrder, user);

    await this.ordersRepository.save(newOrder);

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

    await this.ordersAuditLogRepository.save(auditLog);
  }

  async update(updateOrderDto: UpdateOrderDto, user: User) {
    const existingOrder = await this.ordersRepository.findOneBy({
      uid: updateOrderDto.uid,
    });

    if (existingOrder) {
      if (existingOrder.userId !== user.id) {
        this.logger.error(
          LogsTypes.ErrorUserNotAllowedToUpdateOrder,
          updateOrderDto.uid,
          user,
        );
        return null;
      }
      const oldOrder = JSON.parse(JSON.stringify(existingOrder)) as Order;

      (existingOrder.sourceUid = updateOrderDto.sourceUid),
        (existingOrder.receptionDate = updateOrderDto.receptionDate),
        (existingOrder.statusId =
          updateOrderDto.passportStatus.passportStatusId),
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

      await this.createAuditLog(existingOrder, user, oldOrder);

      return existingOrder;
    } else {
      this.logger.error(LogsTypes.ErrorOrderNotFound, updateOrderDto.uid);
      return null;
    }
  }

  async delete(uid: string, user: User) {
    const existingOrder = await this.ordersRepository.findOneBy({
      uid,
    });

    if (existingOrder) {
      if (existingOrder.userId !== user.id) {
        this.logger.error(
          LogsTypes.ErrorUserNotAllowedToUpdateOrder,
          uid,
          user,
        );
        return null;
      }

      existingOrder.isDeleted = true;
      await this.ordersRepository.save(existingOrder);

      await this.createAuditLog(existingOrder, user);

      return existingOrder;
    } else {
      this.logger.error(LogsTypes.ErrorOrderNotFound, uid);
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
        await this.createAuditLog(order, user);
      }

      return existingOrders;
    } else {
      this.logger.error(LogsTypes.ErrorUserOrdersNotFound, user.id);
      return null;
    }
  }
}
