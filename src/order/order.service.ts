import { Injectable } from '@nestjs/common';
import { Order } from './order.interface';
import {
  CODE_UID_SHORT_LENGTH,
  FALSY_PASSPORT_STATUSES,
  USER_MAX_COUNT_CODES,
} from 'src/constants';
import { LoggerService } from 'src/logger/logger.service';
import { LogsTypes } from 'src/enums';

@Injectable()
export class OrderService {
  private orders: Order[] = [];

  constructor(private readonly logger: LoggerService) {}

  static isValidUid(uid = '') {
    return uid && String(uid).length === 25;
  }

  static isValidUidShort(shortUid = '') {
    return shortUid && String(shortUid).length === CODE_UID_SHORT_LENGTH + 1;
  }

  static isCompleteOrder(order: Order) {
    return (
      order.internalStatus.percent === 0 &&
      FALSY_PASSPORT_STATUSES.includes(order.internalStatus.name.toLowerCase())
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

  static useFactory(raw: Order | unknown, needUpdateTime = true): Order {
    if (typeof raw !== 'object' || raw === null) {
      throw new Error('Invalid rawOrder type');
    }

    const currentOrder = raw as Partial<Order>;

    return {
      uid: currentOrder?.uid,
      shortUid:
        currentOrder?.shortUid ||
        `*${currentOrder?.uid.slice(-CODE_UID_SHORT_LENGTH)}`,
      sourceUid: currentOrder?.sourceUid,
      receptionDate:
        currentOrder?.receptionDate ||
        this.parseReceptionDateFromUid(currentOrder?.uid),
      passportStatus: {
        passportStatusId: currentOrder?.passportStatus?.id,
        name: currentOrder?.passportStatus?.name,
        description: currentOrder?.passportStatus?.description,
        color: currentOrder?.passportStatus?.color,
        subscription: currentOrder?.passportStatus?.subscription,
      },
      internalStatus: {
        name: currentOrder?.internalStatus?.name,
        percent: currentOrder?.internalStatus?.percent,
      },
      updateTime: (currentOrder?.updateTime && !needUpdateTime
        ? new Date(currentOrder?.updateTime)
        : new Date()
      ).toLocaleString('en-EN'),
    };
  }

  get hasOrders() {
    return !!this.orders.length;
  }

  get hasMaxCountOrders() {
    return this.hasOrders && this.orders.length >= USER_MAX_COUNT_CODES;
  }

  get orderStatuses() {
    return this.orders.map((order) => this.getOrderStatus(order));
  }

  findOrderByUid(searchUidPart = '') {
    return this.orders.find((order: Order) =>
      String(order.uid).endsWith(searchUidPart.replace('*', '')),
    );
  }

  findOrderIndexByUid(searchUidPart = '') {
    return this.orders.findIndex((order: Order) =>
      String(order.uid).endsWith(searchUidPart.replace('*', '')),
    );
  }

  createOrder(uid = '') {
    if (!this.hasMaxCountOrders) {
      const newOrder = OrderService.useFactory({ uid });
      this.orders.push(newOrder);
      return newOrder;
    }
    // TODO: Messages.MAX_COUNT_CODES
    this.logger.log(
      LogsTypes.UserHasMaxCountCodes,
      'Messages.MAX_COUNT_CODES',
      { uid },
    );
  }

  updateOrder(order: Order) {
    const orderIndex = this.findOrderIndexByUid(order.uid);
    if (orderIndex >= 0) {
      this.orders[orderIndex] = OrderService.useFactory(order);
      return this.orders[orderIndex];
    }
    // TODO: order is not defined
    this.logger.log(LogsTypes.Error, 'order is not defined', order);
  }

  removeOrder(order: Order) {
    this.orders = this.orders.filter((x) => x.uid !== order.uid);
  }

  removeAllOrders() {
    this.orders = [];
  }

  getOrderStatus(order: Order) {
    const currentOrder = this.findOrderByUid(order.uid);
    if (currentOrder) {
      return (
        (currentOrder.passportStatus?.name
          ? ''
          : 'Messages.CODE_STATUS_EMPTY') + 'Messages.CODE_STATUS(this)' // TODO: Messages.CODE_STATUS_EMPTY
      );
    }
    // TODO: order is not defined
    this.logger.log(LogsTypes.Error, 'order is not defined', order);
  }

  getOrderUpdateTimeString(order: Order) {
    const currentOrder = this.findOrderByUid(order.uid);
    if (currentOrder) {
      return new Date(currentOrder.updateTime).toLocaleString('ru-RU', {
        timeStyle: 'medium',
        dateStyle: 'short',
        timeZone: 'Europe/Moscow',
      });
    }
    // TODO: order is not defined
    this.logger.log(LogsTypes.Error, 'order is not defined', order);
  }

  hasChangesWith(order: Order, newOrder: Order) {
    const currentOrder = this.findOrderByUid(order.uid);
    if (currentOrder) {
      return (
        currentOrder.internalStatus.percent !==
          newOrder.internalStatus.percent ||
        currentOrder.passportStatus.name !== newOrder.passportStatus.name ||
        currentOrder.internalStatus.name !== newOrder.internalStatus.name
      );
    }
    // TODO: order is not defined
    this.logger.log(LogsTypes.Error, 'order is not defined', order);
  }
}
