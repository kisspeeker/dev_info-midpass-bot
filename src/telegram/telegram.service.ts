import { Injectable } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';

import {
  AdminCommands,
  AdminCommandsDescription,
  BotCommands,
  LogsTypes,
  TextCommands,
} from 'src/enums';
import { CustomI18nService } from 'src/i18n/custom-i18n.service';
import { OrdersService } from 'src/orders/orders.service';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entity/user.entity';
import { MessageService } from 'src/message/message.service';
import { AppContext, AppContextAction, BotService } from 'src/bot/bot.service';
import { AutoupdateService } from 'src/autoupdate/autoupdate.service';
import { AppResponseService } from 'src/app-response/app-response.service';

enum TgEvents {
  Start = 'Start',
  Text = 'Text',
  ActionStatus = 'ActionStatus',
  ActionUnsubscribe = 'ActionUnsubscribe',
}

@Injectable()
export class TelegramService {
  private bot: Telegraf;
  private isUnderConstruction: boolean =
    process.env.IS_UNDER_CONSTRUCTION === 'true';

  constructor(
    private readonly botService: BotService,
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
    private readonly messageService: MessageService,
    private readonly autoupdateService: AutoupdateService,
    private readonly i18n: CustomI18nService,
    private readonly appResponseService: AppResponseService,
  ) {
    this.bot = this.botService.bot;
    this.initBot();
    // this.autoupdateService.initCronjobs();
  }

  private async initBot() {
    if (this.isUnderConstruction) {
      this.appResponseService.success(LogsTypes.TgBotStart, null, null, {
        usersCount: 0,
        ordersCount: 0,
        isUnderConstruction: true,
      });
    } else {
      const [usersCountResponse, ordersCountResponse] = await Promise.all([
        await this.usersService.findAllFiltered(),
        await this.ordersService.findAllFiltered(),
      ]);
      if (usersCountResponse.success && ordersCountResponse.success) {
        this.appResponseService.success(LogsTypes.TgBotStart, null, null, {
          usersCount: usersCountResponse.data.length,
          ordersCount: ordersCountResponse.data.length,
          isUnderConstruction: false,
        });
      }
    }

    this.bot.start((ctx) => {
      this.handleUserEvent(ctx, TgEvents.Start);
    });

    for (const command of this.botService.botCommands) {
      this.bot.command(command.command, (ctx) => {
        this.handleUserEvent(ctx, command.command);
      });
    }

    this.bot.on(message('text'), (ctx) => {
      this.handleUserEvent(ctx, TgEvents.Text);
    });

    this.bot.action(/unsubscribe (.+)/, (ctx) => {
      this.handleUserEvent(ctx, TgEvents.ActionUnsubscribe);
    });

    this.bot.action(/status (.+)/, (ctx) => {
      this.handleUserEvent(ctx, TgEvents.ActionStatus);
    });

    this.bot.catch((e) => {
      this.appResponseService.error(
        LogsTypes.ErrorBotCatch,
        '=== BOT CATCH ===',
        null,
        { error: e },
      );
    });
  }

  private async handleUserEvent(
    ctx: AppContext | AppContextAction,
    eventName: TgEvents | BotCommands,
  ) {
    // если не потрогать сессию здесь, то она стирается до выполнения методов
    const isAwaitingSupportMessage = (ctx as AppContext).session
      .awaitingSupportMessage;

    if (await this.handleCheckUnderConstruction(ctx)) {
      return;
    }
    const userResponse = await this.usersService.find(ctx.from, true);
    if (!userResponse.success) {
      return;
    }
    const user = userResponse.data;
    if (user.isBlocked) {
      return;
    }

    switch (eventName) {
      case TgEvents.Start:
      case BotCommands.Start:
        this.handleUserStart(ctx as AppContext, user);
        break;
      case BotCommands.Support:
        this.handleUserSupport(ctx as AppContext, user);
        break;
      case BotCommands.FaqBase:
        this.handleUserFaqBase(ctx as AppContext, user);
        break;
      case BotCommands.FaqStatuses:
        this.handleUserFaqStatuses(ctx as AppContext, user);
        break;
      case BotCommands.Contacts:
        this.handleUserContacts(ctx as AppContext, user);
        break;
      case BotCommands.Schedule:
        this.handleUserSchedule(ctx as AppContext, user);
        break;
      case BotCommands.OrdersList:
        this.handleUserOrdersList(ctx as AppContext, user);
        break;
      case TgEvents.ActionStatus:
        this.handleUserActionStatus(ctx as AppContextAction, user);
        break;
      case TgEvents.ActionUnsubscribe:
        this.handleUserActionUnsubscribe(ctx as AppContextAction, user);
        break;
      case TgEvents.Text:
        this.handleUserText(ctx as AppContext, user);
        break;
      default:
        this.handleUserText(ctx as AppContext, user);
        break;
    }
  }

  private async handleUserText(ctx: AppContext, user: User) {
    const text = String(ctx.message?.text).toLowerCase();
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
        case TextCommands.Admin:
        case TextCommands.Admin1:
          this.handleAdminCommands(ctx, user);
          break;
        default:
          if (ctx.session.awaitingSupportMessage) {
            await this.botService.notify(
              this.i18n.t('admin.user_message', {
                user,
                message: ctx.message.text,
              }),
            );
            await this.messageService.sendMessage(
              user,
              this.i18n.t('user.message_support_sent'),
            );
            return;
          }
          if (OrdersService.isValidUid(textCommand)) {
            this.handleUserSubscribe(ctx, user);
            return;
          }
          await this.appResponseService.error(
            LogsTypes.ErrorOrderValidate,
            user.id,
          );
          await this.messageService.sendMessage(
            user,
            this.i18n.t('user_errors.message_order_validate'),
          );
          return;
      }
    } catch (e) {
      this.appResponseService.error(LogsTypes.Error, e);
    } finally {
      ctx.session.awaitingSupportMessage = false;
    }
  }

  private async handleAdminCommands(ctx: AppContext, user: User) {
    if (!user.isAdmin) {
      return;
    }

    const text = String(ctx.message.text).toLowerCase();
    const textCommand = text.split(' ')[1]?.trim();

    try {
      switch (textCommand) {
        case AdminCommands.User:
          this.handleAdminShowUser(ctx);
          break;
        case AdminCommands.Send:
          this.handleAdminSend(ctx);
          break;
        case AdminCommands.Block:
          this.handleAdminBlock(ctx);
          break;
        case AdminCommands.Block:
          this.handleAdminBlock(ctx);
          break;
        case AdminCommands.Unblock:
          this.handleAdminUnblock(ctx);
          break;
        default:
          if (!textCommand) {
            this.handleAdminShowList(ctx);
            break;
          }
          this.botService.notify(this.i18n.t('admin.error_command_not_found'));
      }
    } catch (e) {
      this.appResponseService.error(LogsTypes.Error, e);
    }
  }

  private async handleAdminShowList(ctx: AppContext) {
    this.botService.notify(
      Object.entries(AdminCommandsDescription)
        .map(
          ([command, description]) =>
            `<code>${TextCommands.Admin} ${command} </code> \n <em>${description}</em>`,
        )
        .join('\n\n'),
    );
  }

  private async handleAdminFindUser(userIdOrUsername: string) {
    try {
      const userResponse = await this.usersService.find({
        id: userIdOrUsername,
        username: userIdOrUsername,
      });

      if (!userResponse.success) {
        return;
      }

      return userResponse.data;
    } catch (e) {
      throw e;
    }
  }

  private async handleAdminShowUser(ctx: AppContext) {
    const userIdOrUsername = ctx.message.text.split(' ')[2];

    try {
      const user = await this.handleAdminFindUser(userIdOrUsername);
      const ordersBeauty = user.orders
        .map((order) => this.messageService.getMessageStatus(order))
        .join('\n\n');
      await this.appResponseService.success(LogsTypes.TgShowUser, '', {
        user,
        ordersBeauty,
      });
    } catch (e) {
      this.appResponseService.error(
        e,
        this.i18n.t('admin.error_show_user', { userIdOrUsername }),
        { userIdOrUsername },
        { userIdOrUsername },
      );
    }
  }

  private async handleAdminBlock(ctx: AppContext) {
    const userId = ctx.message.text.split(' ')[2];
    await this.usersService.block({ id: userId });
  }

  private async handleAdminUnblock(ctx: AppContext) {
    const userId = ctx.message.text.split(' ')[2];
    await this.usersService.unblock({ id: userId });
  }

  private async handleAdminSend(ctx: AppContext) {
    const userIdOrUsername = ctx.message.text.split(' ')[2];
    const messageToUser = ctx.message.text.split(' ').slice(3).join(' ');

    try {
      const userToSend = await this.handleAdminFindUser(userIdOrUsername);

      const messageResponse = await this.messageService.sendMessage(
        userToSend,
        messageToUser,
        {
          disable_notification: true,
        },
      );
      if (messageResponse.success === true) {
        await this.appResponseService.success(
          LogsTypes.TgAdminMessageSent,
          userToSend.id,
          null,
          { user: userToSend, messageToUser },
        );
      }
    } catch (e) {
      this.appResponseService.error(
        e,
        this.i18n.t('admin.error_user_send_message', { userIdOrUsername }),
        { userIdOrUsername },
        { userIdOrUsername },
      );
    }
  }

  private async handleCheckUnderConstruction(
    ctx: AppContext | AppContextAction,
  ) {
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

  private async handleUserStart(ctx: AppContext, user: User) {
    this.appResponseService.success(LogsTypes.TgUserStart, user.id);
    this.messageService.sendMessage(user, this.i18n.t('user.message_start'));
  }

  private async handleUserSupport(ctx: AppContext, user: User) {
    await this.appResponseService.success(LogsTypes.TgUserSupport, user.id);
    await this.messageService.sendMessage(
      user,
      this.i18n.t('user.message_support'),
    );
    ctx.session.awaitingSupportMessage = true;
  }

  private async handleUserFaqBase(ctx: AppContext, user: User) {
    this.appResponseService.success(LogsTypes.TgUserFaqBase, user.id);
    this.messageService.sendMessage(user, this.i18n.t('user.message_faq_base'));
  }

  private async handleUserFaqStatuses(ctx: AppContext, user: User) {
    this.appResponseService.success(LogsTypes.TgUserFaqStatuses, user.id);
    this.messageService.sendMessage(
      user,
      this.i18n.t('user.message_faq_statuses'),
    );
  }

  private async handleUserContacts(ctx: AppContext, user: User) {
    this.appResponseService.success(LogsTypes.TgUserContacts, user.id);
    this.messageService.sendMessage(
      user,
      this.i18n.t('user.message_contacts') + this.i18n.t('user.message_donate'),
    );
  }

  private async handleUserSchedule(ctx: AppContext, user: User) {
    this.appResponseService.success(LogsTypes.TgUserSchedule, user.id);
    this.messageService.sendMessage(
      user,
      this.i18n.t('user.message_autoupdate_schedules'),
    );
  }

  private async handleUserUnsubscribe(ctx: AppContext, user: User) {
    this.messageService.sendMessageInlineUnsubscribe(user);
  }

  private async handleUserActionUnsubscribe(ctx: AppContextAction, user: User) {
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

  private async handleUserSubscribe(ctx: AppContext, user: User) {
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

    const [orderResponse, updatedUserResponse] = await Promise.all([
      await this.ordersService.create({ uid }, user),
      await this.usersService.find(ctx.from),
    ]);

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
  }

  private async handleUserOrdersList(ctx: AppContext, user: User) {
    this.messageService.sendMessageInlineOrders(user);
  }

  private async handleUserActionStatus(ctx: AppContextAction, user: User) {
    const uid = ctx.match[1];
    await this.handleUserStatus(uid, user);

    const messageId = ctx.update.callback_query.message.message_id;
    if (messageId) {
      this.bot.telegram.deleteMessage(user.id, messageId);
    }
  }

  private async handleUserStatus(ctxOrUid: string | AppContext, user: User) {
    const uid =
      typeof ctxOrUid === 'string'
        ? ctxOrUid
        : String(ctxOrUid?.message?.text.split(' ')[1].trim());

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
}
