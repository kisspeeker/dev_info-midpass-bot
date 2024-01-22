// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { TimeoutError, firstValueFrom, timeout } from 'rxjs';
import { resolve } from 'path';

import {
  API_ROUTE_MIDPASS_PROXIES,
  ORDER_UID_LENGTH,
  ORDER_UID_SHORT_LENGTH,
  FALSY_PASSPORT_STATUSES,
  MAX_ORDERS_PER_USER,
  API_MIDPASS_NETWORK_TIMEOUT,
} from 'src/constants';
import { LogsTypes } from 'src/enums';
import { LoggerService } from 'src/logger/logger.service';
import { CreateOrderDto } from 'src/orders/dto/create-order.dto';
import { UpdateOrderDto } from 'src/orders/dto/update-order.dto';
import { User } from 'src/users/entity/user.entity';
import { Order } from 'src/orders/entity/order.entity';
import { OrderAudit } from 'src/orders/entity/order-audit.entity';
import { CustomI18nService } from 'src/i18n/custom-i18n.service';
import { isValidDate } from 'src/utils';
import {
  AppResponseError,
  AppResponseService,
  AppResponseSuccess,
} from 'src/app-response/app-response.service';

@Injectable()
export class OrdersService {
  private proxyIndex = 0;

  constructor(
    @InjectRepository(OrderAudit)
    private ordersAuditLogRepository: Repository<OrderAudit>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private readonly logger: LoggerService,
    private readonly i18n: CustomI18nService,
    private readonly httpService: HttpService,
    private readonly appResponseService: AppResponseService,
  ) {}

  static isValidUid(uid = '') {
    const str = String(uid);

    return (
      uid &&
      str.length === ORDER_UID_LENGTH &&
      str.startsWith('2000') &&
      OrdersService.parseReceptionDateFromUid(str) !== '-'
    );
  }

  static isValidUidShort(shortUid = '') {
    return shortUid && String(shortUid).length === ORDER_UID_SHORT_LENGTH + 1;
  }

  static parseShortUidFromUid(uid = '') {
    return `*${uid.slice(-ORDER_UID_SHORT_LENGTH)}`;
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
      const result = `${year}-${month}-${day}`;
      return isValidDate(result) ? result : '-';
    } catch (e) {
      // console.error(e);
      return '-';
    }
  }

  static isDifferentOrders(currentOrder: Order, newOrder: Order) {
    return (
      currentOrder.statusPercent !== newOrder.statusPercent ||
      currentOrder.statusName !== newOrder.statusName ||
      currentOrder.statusInternalName !== newOrder.statusInternalName
    );
  }

  static async getStatusImage(order: Order) {
    try {
      const statusImagePath = resolve(
        `./public/images/${order.statusPercent}.png`,
      );
      if (fs.existsSync(statusImagePath)) {
        return fs.createReadStream(statusImagePath);
      }
      return fs.createReadStream(resolve('./public/images/fallback.png'));
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  private async getStatusFromMidpass(order: Order) {
    const proxy =
      API_ROUTE_MIDPASS_PROXIES[
        this.proxyIndex % API_ROUTE_MIDPASS_PROXIES.length
      ];

    try {
      const updateOrderDto = (
        await firstValueFrom(
          this.httpService
            .get(`${proxy}/${order.uid}`)
            .pipe(timeout(API_MIDPASS_NETWORK_TIMEOUT)),
        )
      ).data;

      if (!updateOrderDto) {
        throw LogsTypes.ErrorOrderRequestMidpassNotFound;
      }

      return updateOrderDto;
    } catch (e) {
      if (e instanceof TimeoutError) {
        throw LogsTypes.ErrorMidpassTimeout;
      }

      throw e;
    } finally {
      this.proxyIndex++;
    }
  }

  async create(createOrderDto: CreateOrderDto, user: User) {
    try {
      const activeOrdersCount = user.orders.reduce((count, order) => {
        return order.isDeleted ? count : count + 1;
      }, 0);

      if (activeOrdersCount >= MAX_ORDERS_PER_USER) {
        throw LogsTypes.ErrorMaxOrdersPerUser;
      }

      const existingOrder = await this.ordersRepository.findOneBy({
        uid: createOrderDto.uid,
        isDeleted: false,
      });

      if (existingOrder && existingOrder.userId !== user.id) {
        throw LogsTypes.ErrorUserNotAllowedToUpdateOrder;
      }

      const newOrder = await this.ordersRepository.save(
        this.ordersRepository.create({
          uid: String(createOrderDto.uid),
          shortUid: OrdersService.parseShortUidFromUid(createOrderDto.uid),
          receptionDate: OrdersService.parseReceptionDateFromUid(
            createOrderDto.uid,
          ),
          isDeleted: false,
          user,
        }),
      );
      await this.createAuditLog(newOrder, user.id);

      return newOrder;
    } catch (e) {
      throw e;
    }
  }

  async createAuditLog(newOrder: Order, userId: string, oldOrder?: Order) {
    try {
      const auditLog = this.ordersAuditLogRepository.create({
        orderUid: newOrder.uid,
        userId,
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

      return await this.ordersAuditLogRepository.save(auditLog);
    } catch (e) {
      this.appResponseService.error(LogsTypes.Error, e);
    }
  }

  async findAuditLogs(orderUid: string) {
    return await this.ordersAuditLogRepository.findBy({ orderUid });
  }

  async update(existingOrder: Order, userId: string) {
    try {
      const oldOrder = JSON.parse(JSON.stringify(existingOrder)) as Order;
      const updateOrderDto = await this.getStatusFromMidpass(existingOrder);

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

      await this.createAuditLog(existingOrder, userId, oldOrder);
    } catch (e) {
      return e;
    }
  }

  async findAll() {
    try {
      return await this.ordersRepository.find();
    } catch (e) {
      throw e;
    }
  }

  async find(uid: string) {
    try {
      return await this.ordersRepository.findOneBy({
        uid,
      });
    } catch (e) {
      throw e;
    }
  }

  async findAllFiltered() {
    try {
      return await this.ordersRepository.findBy({
        isDeleted: false,
      });
    } catch (e) {
      throw e;
    }
  }

  async delete(uid: string, user: User) {
    try {
      const result = await this.ordersRepository
        .createQueryBuilder()
        .update(Order)
        .set({ isDeleted: true })
        .where({ uid, userId: user.id })
        .returning('*') // updatedOrder
        .execute();

      const updatedOrder = result.raw[0];

      if (!updatedOrder) {
        throw LogsTypes.ErrorOrderNotFound;
      }

      await this.createAuditLog(updatedOrder, user.id);
    } catch (e) {
      throw e;
    }
  }

  async deleteAll(user: User) {
    try {
      const result = await this.ordersRepository
        .createQueryBuilder()
        .update(Order)
        .set({ isDeleted: true })
        .where({ userId: user.id, isDeleted: false }) // Добавляем условие isDeleted: false, чтобы не обновлять уже удаленные заказы
        .returning('*') // Order[]
        .execute();

      const updatedOrders = result.raw as Order[];

      if (updatedOrders.length > 0) {
        for (const order of updatedOrders) {
          await this.createAuditLog(order, user.id);
        }
      } else {
        throw LogsTypes.ErrorOrdersNotFound;
      }
    } catch (e) {
      throw e;
    }
  }
}
