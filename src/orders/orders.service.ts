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
import { OrderAuditLog } from 'src/orders/entity/order-audit-log.entity';
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
    @InjectRepository(OrderAuditLog)
    private ordersAuditLogRepository: Repository<OrderAuditLog>,
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

  static hasChangesWith(currentOrder: Order, newOrder: Order) {
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

  private async getStatusFromMidpass(order: Order): Promise<
    | AppResponseSuccess<{
        proxy: string;
        updateOrderDto?: UpdateOrderDto;
      }>
    | AppResponseError<{
        proxy: string;
        updateOrderDto?: UpdateOrderDto;
      }>
  > {
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
      return await this.appResponseService.success(
        LogsTypes.OrderRequestMidpass,
        updateOrderDto.uid,
        {
          updateOrderDto,
          proxy,
        },
      );
    } catch (e) {
      if (e instanceof TimeoutError) {
        return await this.appResponseService.error(
          LogsTypes.ErrorMidpassTimeout,
          e?.message || 'error in order.service.update',
          { proxy },
        );
      } else {
        return await this.appResponseService.error(
          LogsTypes.ErrorOrderRequest,
          e,
          {
            proxy,
          },
        );
      }
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
        throw {
          type: LogsTypes.ErrorMaxOrdersPerUser,
          message: createOrderDto.uid,
          meta: { user },
        };
      }

      const existingOrder = await this.ordersRepository.findOneBy({
        uid: createOrderDto.uid,
        isDeleted: false,
      });

      if (existingOrder && existingOrder.userId !== user.id) {
        throw {
          type: LogsTypes.ErrorUserNotAllowedToUpdateOrder,
          message: createOrderDto.uid,
          meta: { user, order: existingOrder },
        };
      }

      const newOrder = this.ordersRepository.create({
        uid: String(createOrderDto.uid),
        shortUid: OrdersService.parseShortUidFromUid(createOrderDto.uid),
        receptionDate: OrdersService.parseReceptionDateFromUid(
          createOrderDto.uid,
        ),
        isDeleted: false,
        user,
      });

      await this.ordersRepository.save(newOrder);
      await this.createAuditLog(newOrder, user.id);

      return await this.appResponseService.success(
        LogsTypes.DbOrderCreated,
        newOrder.uid,
        newOrder,
      );
    } catch (e) {
      return await this.appResponseService.error(
        (e?.type as LogsTypes) || e,
        e?.message || 'error in order.service.create',
        null,
        e?.meta || {},
      );
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

      const res = await this.ordersAuditLogRepository.save(auditLog);
      this.appResponseService.success(
        LogsTypes.DbOrderAuditCreated,
        res.id,
        null,
      );
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
      const midpassResponse = await this.getStatusFromMidpass(existingOrder);
      const updateOrderDto = midpassResponse.data.updateOrderDto;

      if (midpassResponse.success === false || !updateOrderDto) {
        throw midpassResponse;
      } else {
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
          (existingOrder.statusInternalName =
            updateOrderDto.internalStatus.name),
          (existingOrder.statusPercent = updateOrderDto.internalStatus.percent),
          (existingOrder.isDeleted = false),
          await this.ordersRepository.save(existingOrder);

        await this.createAuditLog(existingOrder, userId, oldOrder);
      }

      return await this.appResponseService.success(
        LogsTypes.DbOrderUpdated,
        existingOrder.uid,
        {
          order: existingOrder,
          proxy: midpassResponse.data.proxy,
        },
      );
    } catch (e) {
      return e;
    }
  }

  async findAll() {
    try {
      const orders = await this.ordersRepository.find();
      return this.appResponseService.success(
        LogsTypes.DbOrdersFindAll,
        String(orders.length),
        orders,
      );
    } catch (e) {
      return await this.appResponseService.error<Order[]>(
        LogsTypes.Error,
        'error in orders.service.findAll',
      );
    }
  }

  async find(uid: string) {
    try {
      const order = await this.ordersRepository.findOneBy({
        uid,
      });
      return await this.appResponseService.success(
        LogsTypes.DbOrderFind,
        order.uid,
        order,
      );
    } catch (e) {
      return await this.appResponseService.error<Order>(
        LogsTypes.Error,
        'error in orders.service.find',
      );
    }
  }

  async findAllFiltered() {
    try {
      const orders = await this.ordersRepository.findBy({
        isDeleted: false,
      });
      return await this.appResponseService.success(
        LogsTypes.DbOrdersFindAllFiltered,
        String(orders.length),
        orders,
      );
    } catch (e) {
      return await this.appResponseService.error<Order[]>(
        LogsTypes.Error,
        'error in orders.service.findAllFiltered',
      );
    }
  }

  async delete(uid: string, user: User) {
    try {
      const existingOrder = await this.ordersRepository.findOneBy({
        uid,
      });

      if (existingOrder) {
        if (existingOrder.userId !== user.id) {
          throw {
            type: LogsTypes.ErrorUserNotAllowedToUpdateOrder,
            message: uid,
            data: null,
            meta: { user, order: existingOrder },
          };
        }

        existingOrder.isDeleted = true;
        await this.ordersRepository.save(existingOrder);
        await this.createAuditLog(existingOrder, user.id);

        return await this.appResponseService.success(
          LogsTypes.DbOrderDeleted,
          existingOrder.uid,
          existingOrder,
        );
      } else {
        throw {
          type: LogsTypes.ErrorOrderNotFound,
          message: uid,
          meta: { user },
        };
      }
    } catch (e) {
      return await this.appResponseService.error(
        e?.type || LogsTypes.ErrorOrderNotFound,
        e?.message || 'error in orders.service.delete',
        null,
        e?.meta || { user },
      );
    }
  }

  async deleteAll(user: User) {
    try {
      const existingOrders = await this.ordersRepository.findBy({
        userId: user.id,
      });

      if (Array.isArray(existingOrders) && existingOrders.length) {
        existingOrders.forEach((order) => {
          order.isDeleted = true;
        });

        await this.ordersRepository.save(existingOrders);

        for (const order of existingOrders) {
          this.appResponseService.success(
            LogsTypes.DbOrderDeleted,
            order.uid,
            order,
          );
          await this.createAuditLog(order, user.id);
        }

        return await this.appResponseService.success(
          LogsTypes.DbOrdersDeletedAll,
          user.id,
          existingOrders,
          { user },
        );
      } else {
        throw {
          type: LogsTypes.ErrorOrdersNotFound,
          message: user.id,
        };
      }
    } catch (e) {
      return await this.appResponseService.error(
        e?.type || LogsTypes.Error,
        e?.message || 'error in orders.service.deleteAll',
      );
    }
  }
}
