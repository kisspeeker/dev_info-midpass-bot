import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { AppResponseService } from 'src/app-response/app-response.service';
import { API_ROUTE_MIDPASS_PROXIES } from 'src/constants';
import { AutoupdateSchedules, LogsTypes, Timeouts } from 'src/enums';
import { LoggerService } from 'src/logger/logger.service';
import { MessageService } from 'src/message/message.service';
import { Order } from 'src/orders/entity/order.entity';
import { OrdersService } from 'src/orders/orders.service';
import { UsersService } from 'src/users/users.service';
import { calculateTimeDifference, sleep } from 'src/utils';

type AutoupdateCounter = {
  ordersAll: number;
  usersChecked: number;
  ordersChecked: number;
  ordersUpdated: number;
  ordersError: number;
  ordersErrorMidpassNotFound: number;
  routes: Record<string, number>;
  usersCheckedList: string[];
  duration: string;
};

@Injectable()
export class AutoupdateService {
  constructor(
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
    private readonly messageService: MessageService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly logger: LoggerService,
    private readonly appResponseService: AppResponseService,
  ) {}

  public initCronjobs() {
    Object.keys(AutoupdateSchedules).forEach((name) => {
      const job = new CronJob(
        AutoupdateSchedules[name],
        async () => await this.handleAutoupdateOrders(),
        null,
        true,
        'Europe/Moscow',
      );
      this.schedulerRegistry.addCronJob(name, job);
      this.schedulerRegistry.getCronJob(name).start();
    });
  }

  private async handleAutoupdateOrders() {
    const startDate = new Date();
    const counter = this.initAutoupdateCounter();
    this.logger.log(LogsTypes.AutoupdateStart, `${startDate}`);

    try {
      const ordersResponse = await this.ordersService.getAllFiltered();
      if (!ordersResponse.success) {
        throw ordersResponse;
      }

      const orders = ordersResponse.data;
      counter.ordersAll = orders.length;

      for (const order of orders) {
        const res = await this.processOrder(order, counter);
        if (res.error === LogsTypes.ErrorMidpassTimeout) {
          throw res;
        }
        await sleep(Timeouts.CronjobNextOrder);
      }

      counter.usersChecked = [...new Set(counter.usersCheckedList)].length;
      counter.duration = calculateTimeDifference(startDate);
    } catch (e) {
      this.appResponseService.error(
        LogsTypes.ErrorAutoupdateRoot,
        'error in autoupdate.service.handleAutoupdateOrders',
      );
    } finally {
      this.logger.log(LogsTypes.AutoupdateEnd, `${new Date()}`, { counter });
    }
  }

  private initAutoupdateCounter(): AutoupdateCounter {
    return {
      ordersAll: 0,
      usersChecked: 0,
      ordersChecked: 0,
      ordersUpdated: 0,
      ordersError: 0,
      ordersErrorMidpassNotFound: 0,
      routes: API_ROUTE_MIDPASS_PROXIES.reduce((acc, curr) => {
        acc[curr] = 0;
        return acc;
      }, {}),
      usersCheckedList: [],
      duration: '',
    };
  }

  private async processOrder(order: Order, counter: AutoupdateCounter) {
    try {
      if (OrdersService.isCompleteOrder(order)) {
        return;
      }
      counter.ordersChecked++;
      counter.usersCheckedList.push(order.userId);

      const midpassResultResponse = await this.ordersService.update(
        order,
        order.userId,
      );

      if (midpassResultResponse.success === false) {
        counter.routes[midpassResultResponse.data.proxy]++;
        throw midpassResultResponse;
      }
      const midpassResult = midpassResultResponse.data;

      counter.routes[midpassResult.proxy] =
        (counter.routes[midpassResult.proxy] || 0) + 1;

      const hasChanges = OrdersService.hasChangesWith(
        order,
        midpassResult.order,
      );

      if (hasChanges) {
        const userResponse = await this.usersService.find({ id: order.userId });
        if (!userResponse.success) {
          return;
        }
        const user = userResponse.data;
        counter.ordersUpdated++;
        await this.messageService.sendMessageStatus(user, midpassResult.order);
        this.logger.log(LogsTypes.AutoupdateOrderChanged, user.id, { order });
        return;
      }
      this.logger.log(LogsTypes.AutoupdateOrderWithoutChanges, order.userId, {
        order,
      });
    } catch (e) {
      counter.ordersError++;
      if (e?.message === LogsTypes.ErrorOrderRequestMidpassNotFound) {
        counter.ordersErrorMidpassNotFound++;
      }

      return e?.error === LogsTypes.ErrorMidpassTimeout
        ? e
        : this.appResponseService.error(
            LogsTypes.ErrorAutoupdateOrder,
            e?.error || e?.message || e,
            null,
            {
              order,
            },
          );
    }
  }
}
