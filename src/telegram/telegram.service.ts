import { Injectable } from '@nestjs/common';
import { Context, NarrowedContext, Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';

import { BotCommands, LogsTypes, TextCommands } from 'src/enums';
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
import { MessageService } from 'src/message/message.service';
import { BotService } from 'src/bot/bot.service';
import { AutoupdateService } from 'src/autoupdate/autoupdate.service';
import { AppResponseService } from 'src/app-response/app-response.service';
import { NotificationService } from 'src/notification/notification.service';

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

enum TgEvents {
  Start = 'Start',
  Text = 'Text',
  Action = 'Action',
}

@Injectable()
export class TelegramService {
  private bot: Telegraf;
  private adminId: string = process.env.TG_ADMIN_ID;
  private isUnderConstruction: boolean =
    process.env.IS_UNDER_CONSTRUCTION === 'true';

  constructor(
    private readonly botService: BotService,
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
    private readonly messageService: MessageService,
    private readonly notificationService: NotificationService,
    private readonly autoupdateService: AutoupdateService,
    private readonly logger: LoggerService,
    private readonly i18n: CustomI18nService,
    private readonly appResponseService: AppResponseService,
  ) {
    this.bot = this.botService.bot;
    this.initBot();
    // this.autoupdateService.initCronjobs();
  }

  private async initBot() {
    if (this.isUnderConstruction) {
      this.appResponseService.success(
        LogsTypes.TgBotStart,
        'isUnderConstruction',
        null,
      );
    } else {
      const usersCountResponse = await this.usersService.findAllWithOrders();
      if (usersCountResponse.success) {
        this.appResponseService.success(
          LogsTypes.TgBotStart,
          `UsersWithOrders: ${(usersCountResponse.data || []).length}`,
          null,
        );
      }
    }

    this.bot.start(async (ctx: TgContext) => {
      this.handleUserEvent(ctx, TgEvents.Start);
    });

    for (const command of this.botService.botCommands) {
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

    this.bot.catch(async (e) => {
      this.appResponseService.error(
        LogsTypes.ErrorBotCatch,
        '=== BOT CATCH ===',
        null,
        { error: e },
      );
    });
  }

  private async handleUserEvent(
    ctx: TgContext | TgContextAction,
    eventName: TgEvents | BotCommands,
  ) {
    if (await this.handleCheckUnderConstruction(ctx)) {
      return;
    }
    const userResponse = await this.usersService.find(ctx.from);
    if (!userResponse.success) {
      return;
    }
    const user = userResponse.data;

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
          await this.notificationService.sendMessageToAdmin(ctx.message.text);
      }
    } catch (e) {
      this.appResponseService.error(LogsTypes.Error, e);
    }
  }

  private async handleCheckUnderConstruction(ctx: TgContext | TgContextAction) {
    if (this.isUnderConstruction) {
      this.bot.telegram.sendMessage(
        ctx.from.id,
        this.i18n.t('user.message_under_construction'),
        {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        },
      );
    }
    return this.isUnderConstruction;
  }

  private async handleUserStart(ctx: TgContext, user: User) {
    this.appResponseService.success(LogsTypes.TgUserStart, user.id, null);
    this.messageService.sendMessage(user, this.i18n.t('user.message_start'));
  }

  private async handleUserFaqBase(ctx: TgContext, user: User) {
    this.appResponseService.success(LogsTypes.TgUserFaqBase, user.id, null);
    this.messageService.sendMessage(user, this.i18n.t('user.message_faq_base'));
  }

  private async handleUserFaqStatuses(ctx: TgContext, user: User) {
    this.appResponseService.success(LogsTypes.TgUserFaqStatuses, user.id, null);
    this.messageService.sendMessage(
      user,
      this.i18n.t('user.message_faq_statuses'),
    );
  }

  private async handleUserContacts(ctx: TgContext, user: User) {
    this.appResponseService.success(LogsTypes.TgUserContacts, user.id, null);
    this.messageService.sendMessage(
      user,
      this.i18n.t('user.message_contacts') + this.i18n.t('user.message_donate'),
    );
  }

  private async handleUserSchedule(ctx: TgContext, user: User) {
    this.appResponseService.success(LogsTypes.TgUserSchedule, user.id, null);
    this.messageService.sendMessage(
      user,
      this.i18n.t('user.message_autoupdate_schedules'),
    );
  }

  private async handleUserUnsubscribe(ctx: TgContext, user: User) {
    this.messageService.sendMessageInline(user);
  }

  private async handleUserActionUnsubscribe(ctx: TgContextAction, user: User) {
    const uid = ctx.match[1];

    const deletedOrderResponse = await this.ordersService.delete(uid, user);
    if (!deletedOrderResponse.success) {
      this.messageService.sendMessage(
        user,
        this.i18n.t('user_errors.message_order_unsubscribe', {
          order: { uid },
        }),
      );
      return;
    }
    const deletedOrder = deletedOrderResponse.data;
    this.appResponseService.success(
      LogsTypes.TgUserUnsubscribed,
      user.id,
      null,
      {
        order: deletedOrder,
      },
    );
    const updatedUserResponse = await this.usersService.find(ctx.from);
    if (!updatedUserResponse.success) {
      return;
    }
    const updatedUser = updatedUserResponse.data;
    const messageId = ctx.update.callback_query.message.message_id;

    this.messageService.sendMessage(
      updatedUser,
      this.i18n.t('user.message_unsubscribe_success', {
        order: deletedOrder,
      }),
    );

    if (messageId) {
      this.bot.telegram.deleteMessage(user.id, messageId);
    }
  }

  private async handleUserSubscribe(ctx: TgContext, user: User) {
    const uid = String(ctx.message.text.split(' ')[0]).trim();
    const existingOrder = user.filteredOrders.find(
      (order) => order.uid === uid,
    );

    if (existingOrder) {
      this.appResponseService.success(
        LogsTypes.TgUserSubscribedAlready,
        user.id,
        null,
        {
          order: existingOrder,
        },
      );
      this.messageService.sendMessageStatus(
        user,
        existingOrder,
        'subscribedAlready',
      );
      return;
    }

    const orderResponse = await this.ordersService.create({ uid }, user);
    const updatedUserResponse = await this.usersService.find(ctx.from);

    if (!orderResponse.success || !updatedUserResponse.success) {
      if (
        orderResponse.success === false &&
        orderResponse.error === LogsTypes.ErrorMaxOrdersPerUser
      ) {
        this.messageService.sendMessage(
          user,
          this.i18n.t('user_errors.message_max_orders_per_user', {
            count: user.filteredOrders.length,
          }),
        );
      } else {
        this.messageService.sendMessage(
          user,
          this.i18n.t('user_errors.message_order_subscribe', {
            order: { uid },
          }),
        );
      }
      return;
    }
    const order = orderResponse.data;
    const updatedUser = updatedUserResponse.data;

    if (order) {
      this.appResponseService.success(
        LogsTypes.TgUserSubscribed,
        updatedUser.id,
        null,
        { order },
      );
      this.messageService.sendMessageStatus(updatedUser, order, 'subscribed');
      return;
    }

    this.appResponseService.error(
      LogsTypes.ErrorOrderValidate,
      updatedUser.id,
      null,
      { order },
    );
    this.messageService.sendMessage(
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
        this.appResponseService.success(
          LogsTypes.TgUserOrderStatus,
          user.id,
          null,
          {
            order: existingOrder,
          },
        );
        this.messageService.sendMessageStatus(user, existingOrder);
      } else {
        this.appResponseService.error(LogsTypes.ErrorOrderNotFound, uid, null, {
          user,
        });
        this.messageService.sendMessage(
          user,
          this.i18n.t('user_errors.message_order_not_found'),
        );
      }
      return;
    }

    this.appResponseService.error(LogsTypes.ErrorOrderValidate, uid, null, {
      user,
    });
    this.messageService.sendMessage(
      user,
      this.i18n.t('user_errors.message_order_validate'),
    );
  }

  private async handleAdminSend(ctx: TgContext) {
    const userId = ctx.message.text.split(' ')[1];
    const messageToUser = ctx.message.text.split(' ').slice(2).join(' ');
    const userToSendResponse = await this.usersService.find({ id: userId });
    if (!userToSendResponse.success) {
      return;
    }
    const userToSend = userToSendResponse.data;

    this.messageService.sendMessage(userToSend, messageToUser, {
      disable_notification: true,
    });
  }

  private async handleAdminTest(ctx: TgContext, user: User) {
    this.messageService.sendMessage(user, 'Тестовая команда для админа');
  }
}
