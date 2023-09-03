import { Injectable } from '@nestjs/common';
import { Context, Markup, NarrowedContext, Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';

import {
  AutoupdateSchedules,
  BotCommands,
  LogsTypes,
  TextCommands,
  Timeouts,
} from 'src/enums';
import { LoggerService } from 'src/logger/logger.service';
import { CustomI18nService } from 'src/i18n/custom-i18n.service';
import { OrdersService } from 'src/orders/orders.service';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entity/user.entity';
import {
  CallbackQuery,
  Message,
  Update,
} from 'telegraf/typings/core/types/typegram';
import { Order } from 'src/orders/entity/order.entity';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { calculateTimeDifference, sleep } from 'src/utils';
import { API_ROUTE_MIDPASS_PROXIES } from 'src/constants';

type TgContext = NarrowedContext<
  Context<Update>,
  {
    message: Update.New & Update.NonChannel & Message.TextMessage;
    update_id: number;
  }
>;

type TgContextAction = NarrowedContext<
  Context<Update> & {
    message: Update.New & Update.NonChannel & Message.TextMessage;
    match: RegExpExecArray;
  },
  Update.CallbackQueryUpdate<CallbackQuery>
>;

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

enum TgEvents {
  Start = 'Start',
  Text = 'Text',
  Action = 'Action',
}

const botCommands = [
  {
    command: BotCommands.Start,
    description: 'Команда для старта',
  },
  {
    command: BotCommands.Help,
    description: 'Как пользоваться ботом',
  },
  {
    command: BotCommands.FaqBase,
    description: 'Как пользоваться ботом',
  },
  {
    command: BotCommands.FaqStatuses,
    description: 'Значения статусов заявлений',
  },
  {
    command: BotCommands.Schedule,
    description: 'Расписание автообновления заявлений',
  },
  {
    command: BotCommands.Contacts,
    description: 'Контакты автора для вопросов и предложений',
  },
];

@Injectable()
export class TelegramService {
  private bot: Telegraf;
  private adminId: string = process.env.TG_ADMIN_ID;
  private isUnderConstruction: boolean =
    process.env.IS_UNDER_CONSTRUCTION === 'true';

  constructor(
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
    private readonly logger: LoggerService,
    private readonly i18n: CustomI18nService,
    private schedulerRegistry: SchedulerRegistry,
  ) {
    this.bot = new Telegraf(process.env.TG_BOT_TOKEN);
    this.initBot();
    // this.initCronjobs();
  }

  private async handleUserEvent(
    ctx: TgContext | TgContextAction,
    eventName: TgEvents | BotCommands,
  ) {
    if (await this.handleCheckUnderConstruction(ctx)) {
      return;
    }
    const user = await this.usersService.find(ctx.from);

    switch (eventName) {
      case TgEvents.Start:
      case BotCommands.Start:
        await this.handleUserStart(ctx as TgContext, user);
        break;
      case BotCommands.Help:
      case BotCommands.FaqBase:
        await this.handleUserFaqBase(ctx as TgContext, user);
        break;
      case BotCommands.FaqStatuses:
        await this.handleUserFaqStatuses(ctx as TgContext, user);
        break;
      case BotCommands.Contacts:
        await this.handleUserContacts(ctx as TgContext, user);
        break;
      case BotCommands.Schedule:
        await this.handleUserSchedule(ctx as TgContext, user);
        break;
      case TgEvents.Action:
        await this.handleUserActionUnsubscribe(ctx as TgContextAction, user);
        break;
      case TgEvents.Text:
        await this.handleUserText(ctx as TgContext, user);
        break;
      default:
        await this.handleUserText(ctx as TgContext, user);
        break;
    }
  }

  private initBot() {
    this.bot.start(async (ctx: TgContext) => {
      this.handleUserEvent(ctx, TgEvents.Start);
    });

    for (const command of botCommands) {
      this.bot.command(command.command, (ctx: TgContext) => {
        this.handleUserEvent(ctx, command.command);
      });
    }

    this.bot.on(message('text'), async (ctx: TgContext) => {
      this.handleUserEvent(ctx, TgEvents.Text);
    });

    this.bot.action(/unsubscribe (.+)/, async (ctx: TgContextAction) => {
      this.handleUserEvent(ctx, TgEvents.Action);
    });

    this.bot.catch((e) => {
      this.logger.error(LogsTypes.Error, '=== BOT CATCH ===', { error: e });
    });
  }

  private initCronjobs() {
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

  private async handleUserText(ctx: TgContext, user: User) {
    const text = String(ctx.message.text).toLowerCase();
    const textCommand = String(text.split(' ')[0]).trim();

    try {
      switch (textCommand) {
        case TextCommands.Unsubscribe:
          this.handleUserUnsubscribe(ctx, user);
          break;
        case TextCommands.Status:
        case TextCommands.StatusUpdate:
          this.handleUserStatus(ctx, user);
          break;
        case TextCommands.AdminSend:
          if (user.id === this.adminId) {
            this.handleAdminSend(ctx);
            break;
          }
        case TextCommands.AdminTest:
          if (user.id === this.adminId) {
            this.handleAdminTest(ctx, user);
            break;
          }
        default:
          if (OrdersService.isValidUid(textCommand)) {
            this.handleUserSubscribe(ctx, user);
            return;
          }
          this.sendMessage(user, 'default');
      }
    } catch (e) {
      this.logger.error(LogsTypes.Error, e);
    }
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
        await this.sendMessageStatus(user, midpassResult.order);
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

  private async handleCheckUnderConstruction(ctx: TgContext | TgContextAction) {
    if (this.isUnderConstruction) {
      await this.bot.telegram.sendMessage(
        ctx.from.id,
        this.i18n.t('user.message_donate'),
        {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        },
      );
    }
    return this.isUnderConstruction;
  }

  private async handleUserStart(ctx: TgContext, user: User) {
    this.logger.log(LogsTypes.TgUserStart, user.id);
    await this.sendMessage(user, this.i18n.t('user.message_start'));
  }

  private async handleUserFaqBase(ctx: TgContext, user: User) {
    this.logger.log(LogsTypes.TgUserFaqBase, user.id);
    await this.sendMessage(user, this.i18n.t('user.message_faq_base'));
  }

  private async handleUserFaqStatuses(ctx: TgContext, user: User) {
    this.logger.log(LogsTypes.TgUserFaqStatuses, user.id);
    await this.sendMessage(user, this.i18n.t('user.message_faq_statuses'));
  }

  private async handleUserContacts(ctx: TgContext, user: User) {
    this.logger.log(LogsTypes.TgUserContacts, user.id);
    await this.sendMessage(
      user,
      this.i18n.t('user.message_contacts') + this.i18n.t('user.message_donate'),
    );
  }

  private async handleUserSchedule(ctx: TgContext, user: User) {
    this.logger.log(LogsTypes.TgUserSchedule, user.id);
    await this.sendMessage(
      user,
      this.i18n.t('user.message_autoupdate_schedules'),
    );
  }

  private async handleUserUnsubscribe(ctx: TgContext, user: User) {
    await this.sendMessageInline(user);
  }

  private async handleUserActionUnsubscribe(ctx: TgContextAction, user: User) {
    const uid = ctx.match[1];

    const deletedOrder = await this.ordersService.delete(uid, user);
    if (deletedOrder) {
      this.logger.log(LogsTypes.TgUserUnsubscribed, user.id, {
        order: deletedOrder,
      });
      const updatedUser = await this.usersService.find(ctx.from);
      const messageId = ctx.update.callback_query.message.message_id;

      console.warn('updatedUser', updatedUser);

      await this.sendMessage(
        updatedUser,
        this.i18n.t('user.message_unsubscribe_success', {
          order: deletedOrder,
        }),
      );

      if (messageId) {
        await this.bot.telegram.deleteMessage(user.id, messageId);
      }
      return;
    }
    this.logger.error(LogsTypes.ErrorOrderDelete, uid);
  }

  private async handleUserSubscribe(ctx: TgContext, user: User) {
    const uid = String(ctx.message.text.split(' ')[0]).trim();
    const existingOrder = user.filteredOrders.find(
      (order) => order.uid === uid,
    );

    if (existingOrder) {
      this.logger.log(LogsTypes.TgUserSubscribedAlready, user.id, {
        order: existingOrder,
      });
      await this.sendMessageStatus(user, existingOrder, 'subscribedAlready');
      return;
    }

    const order = await this.ordersService.create({ uid }, user);
    const updatedUser = await this.usersService.find(ctx.from);

    if (order) {
      this.logger.log(LogsTypes.TgUserSubscribed, updatedUser.id, { order });
      await this.sendMessageStatus(updatedUser, order, 'subscribed');
      return;
    }

    this.logger.log(LogsTypes.ErrorOrderValidate, updatedUser.id, { order });
    await this.sendMessage(
      updatedUser,
      this.i18n.t('user_errors.message_order_validate'),
    );
  }

  private async handleUserStatus(ctx: TgContext, user: User) {
    const uid = String(ctx.message.text.split(' ')[1]).trim();

    if (OrdersService.isValidUid(uid) || OrdersService.isValidUidShort(uid)) {
      const existingOrder = user.filteredOrders.find(
        (order) => order.uid === uid || order.shortUid === uid,
      );

      if (existingOrder) {
        this.logger.log(LogsTypes.TgUserOrderStatus, user.id, {
          order: existingOrder,
        });
        await this.sendMessageStatus(user, existingOrder);
      } else {
        this.logger.error(LogsTypes.ErrorOrderNotFound, uid, { user });
        await this.sendMessage(
          user,
          this.i18n.t('user_errors.message_order_not_found'),
        );
      }
      return;
    }

    this.logger.log(LogsTypes.ErrorOrderValidate, uid, { user });
    await this.sendMessage(
      user,
      this.i18n.t('user_errors.message_order_validate'),
    );
  }

  private async handleAdminSend(ctx: TgContext) {
    const userId = ctx.message.text.split(' ')[1];
    const userToSend = await this.usersService.find({ id: userId });
    const messageToUser = ctx.message.text.split(' ').slice(2).join(' ');

    await this.sendMessage(userToSend, messageToUser, {
      disable_notification: true,
    });
  }

  private async handleAdminTest(ctx: TgContext, user: User) {
    await this.sendMessage(user, 'Тестовая команда для админа');
  }

  private useKeyboardDefault(user: User) {
    const res = [];

    if (user) {
      user.filteredOrders.forEach((order) =>
        res.push([
          Markup.button.text(
            this.i18n.t('user.button_status_order', { order }),
          ),
        ]),
      );
      if (user.filteredOrders.length) {
        res.push([Markup.button.text(this.i18n.t('user.button_unsubscribe'))]);
      }
    }
    return res.length ? Markup.keyboard(res).resize() : Markup.removeKeyboard();
  }

  private useKeyboardInlineUnsubscribe = (user: User) => {
    const res = [];
    if (user && user.filteredOrders.length) {
      user.filteredOrders.forEach((order) =>
        res.push([
          Markup.button.callback(
            this.i18n.t('user.button_unsubscribe_order', { order }),
            `unsubscribe ${order.uid}`,
          ),
        ]),
      );
    }
    return res.length ? Markup.inlineKeyboard.bind(this)(res).resize() : [];
  };

  private async sendMessage(
    user: User,
    message: string,
    extra: {
      disable_notification?: boolean;
    } = {},
  ) {
    await this.bot.telegram.sendMessage(user.id, message, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...this.useKeyboardDefault(user),
      ...extra,
    });
  }

  private async sendMessageInline(user: User) {
    await this.bot.telegram.sendMessage(
      user.id,
      this.i18n.t('user.message_unsubscribe'),
      {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...this.useKeyboardInlineUnsubscribe(user),
      },
    );
  }

  private async sendMessageStatus(
    user: User,
    order: Order,
    type?: 'changed' | 'subscribed' | 'subscribedAlready',
  ) {
    const image = await OrdersService.getStatusImage(order);
    const orderBeauty = this.i18n.t('user.message_status_order_beauty', {
      order,
    });
    const donate = this.i18n.t('user.message_donate');
    let message = this.i18n.t('user.message_order_empty');

    if (type === 'changed') {
      message = this.i18n.t('user.message_order_changed');
    } else if (type === 'subscribed') {
      message = this.i18n.t('user.message_order_subscribed');
    } else if (type === 'subscribedAlready') {
      message = this.i18n.t('user.message_order_subscribed_already');
    }

    message += orderBeauty;

    if (type === 'changed') {
      message += donate;
    }

    await this.bot.telegram.sendPhoto(
      user.id,
      {
        source: image,
      },
      {
        parse_mode: 'HTML',
        caption: message,
        ...this.useKeyboardDefault(user),
      },
    );
  }

  async startBot() {
    if (this.isUnderConstruction) {
      this.logger.log(LogsTypes.TgBotStart, 'isUnderConstruction');
      this.bot.launch();
    } else {
      const usersCount = (await this.usersService.findAllWithOrders()).length;
      this.logger.log(LogsTypes.TgBotStart, `UsersWithOrders: ${usersCount}`);
      await this.bot.telegram.setMyCommands(botCommands);
      await this.bot.launch();
    }
  }
}
