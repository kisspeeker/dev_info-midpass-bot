import { Injectable } from '@nestjs/common';
import { Context, Markup, NarrowedContext, Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';

import { LogsTypes, TextCommands } from 'src/enums';
import { LoggerService } from 'src/logger/logger.service';
import { CustomI18nService } from 'src/i18n/custom-i18n.service';
import { OrdersService } from 'src/orders/orders.service';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entity/user.entity';
import { Message, Update } from 'telegraf/typings/core/types/typegram';
import { Order } from 'src/orders/entity/order.entity';

type TgContext = NarrowedContext<
  Context<Update>,
  {
    message: Update.New & Update.NonChannel & Message.TextMessage;
    update_id: number;
  }
>;

@Injectable()
export class TelegramService {
  private bot: Telegraf;
  private adminId: string = process.env.TG_ADMIN_ID;

  constructor(
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
    private readonly logger: LoggerService,
    private readonly i18n: CustomI18nService,
  ) {
    this.bot = new Telegraf(process.env.TG_BOT_TOKEN);
    this.initBot();
  }

  private initBot() {
    this.bot.start((ctx: TgContext) => this.handleUserStart(ctx));

    this.bot.on(message('text'), (ctx: TgContext) => this.handleUserText(ctx));

    this.bot.catch((e) => {
      this.logger.error(LogsTypes.Error, '=== BOT CATCH ===', { error: e });
    });
  }

  private async handleUserStart(ctx: TgContext, currentUser?: User) {
    const user = currentUser || (await this.usersService.create(ctx.from));
    await this.sendMessage(user, this.i18n.t('user.message_start'));
    this.logger.log(LogsTypes.TgUserStart, user.id);
  }

  private async handleUserText(ctx: TgContext) {
    const user = await this.usersService.find(ctx.from);
    const text = String(ctx.message.text).toLowerCase();
    const textCommand = String(text.split(' ')[0]).trim();

    try {
      switch (textCommand) {
        case TextCommands.Start1:
        case TextCommands.Start2:
        case TextCommands.Start3:
        case TextCommands.Help1:
        case TextCommands.Help2:
        case TextCommands.Help3:
        case TextCommands.Help4:
          this.handleUserStart(ctx, user);
          break;
        case TextCommands.Faq:
          this.handleUserFaq(ctx, user);
          break;
        case TextCommands.Schedule:
          this.handleUserSchedule(ctx, user);
          break;
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

  private async handleUserFaq(ctx: TgContext, user: User) {
    await this.sendMessage(user, this.i18n.t('user.message_faq_base'));
    await this.sendMessage(user, this.i18n.t('user.message_faq_statuses'));
  }

  private async handleUserSchedule(ctx: TgContext, user: User) {
    await this.sendMessage(
      user,
      this.i18n.t('user.message_autoupdate_schedules'),
    );
  }

  private async handleUserUnsubscribe(ctx: TgContext, user: User) {
    console.warn('handleUserUnsubscribe');
  }

  private async handleUserSubscribe(ctx: TgContext, user: User) {
    const uid = String(ctx.message.text.split(' ')[0]).trim();
    const existingOrder = user.orders.find((order) => order.uid === uid);

    if (existingOrder) {
      await this.sendMessageStatus(user, existingOrder, 'subscribedAlready');
      return;
    }

    const order = await this.ordersService.create({ uid }, user);

    if (order) {
      await this.sendMessageStatus(user, order, 'subscribed');
    }
  }

  private async handleUserStatus(ctx: TgContext, user: User) {
    const uid = String(ctx.message.text.split(' ')[1]).trim();

    if (OrdersService.isValidUid(uid) || OrdersService.isValidUidShort(uid)) {
      const existingOrder = user.orders.find(
        (order) => order.uid === uid || order.shortUid === uid,
      );

      if (existingOrder) {
        await this.sendMessageStatus(user, existingOrder);
      }
    }
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
    const res = [
      [
        Markup.button.text(this.i18n.t('user.button_faq')),
        Markup.button.text(this.i18n.t('user.button_schedule')),
      ],
    ];

    if (user && user.orders.length) {
      user.orders.forEach((order) =>
        res.push([
          Markup.button.text(
            this.i18n.t('user.button_status_order', { order }),
          ),
        ]),
      );
      res.push([Markup.button.text(this.i18n.t('user.button_unsubscribe'))]);
    }
    return res.length ? Markup.keyboard(res).resize() : [];
  }

  private useKeyboardInlineUnsubscribe = (user: User) => {
    const res = [];
    if (user && user.orders.length) {
      user.orders.forEach((order) =>
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

  private async sendMessageInline(user: User, message: string) {
    await this.bot.telegram.sendMessage(user.id, message, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...this.useKeyboardInlineUnsubscribe(user),
    });
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
    let message = '';

    if (!order.statusPercent) {
      message = this.i18n.t('user.message_order_empty');
    }

    if (type === 'changed') {
      message =
        this.i18n.t('user.message_order_changed') +
        message +
        orderBeauty +
        donate;
    } else if (type === 'subscribed') {
      message =
        this.i18n.t('user.message_order_subscribed') + message + orderBeauty;
    } else if (type === 'subscribedAlready') {
      message =
        this.i18n.t('user.message_order_subscribed_already') +
        message +
        orderBeauty;
    } else {
      message = message + orderBeauty;
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
    const usersCount = (await this.usersService.findAllWithOrders()).length;
    this.logger.log(LogsTypes.TgBotStart, `UsersWithOrders: ${usersCount}`);
    this.bot.launch();
  }
}
