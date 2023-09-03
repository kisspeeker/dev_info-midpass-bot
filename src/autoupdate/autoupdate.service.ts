import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
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
      const orders = await this.ordersService.getAllFiltered();
      counter.ordersAll = orders.length;

      for (const order of orders) {
        await this.processOrder(order, counter);
        await sleep(Timeouts.CronjobNextOrder);
      }

      counter.usersChecked = [...new Set(counter.usersCheckedList)].length;
      counter.duration = calculateTimeDifference(startDate);
    } catch (e) {
      this.logger.error(LogsTypes.ErrorAutoupdateRoot, e);
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

      const midpassResult = await this.ordersService.update(
        order,
        order.userId,
      );

      if (midpassResult.error) {
        counter.routes[midpassResult.proxy]++;
        throw `handleAutoupdateOrders processOrder ${midpassResult.error}`;
      }

      counter.routes[midpassResult.proxy] =
        (counter.routes[midpassResult.proxy] || 0) + 1;

      const hasChanges = OrdersService.hasChangesWith(
        order,
        midpassResult.order,
      );

      if (hasChanges) {
        const user = await this.usersService.find({ id: order.userId });
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
      this.logger.error(LogsTypes.ErrorAutoupdateOrder, e, { order });
    }
  }
}
