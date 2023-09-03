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
    private readonly autoupdateService: AutoupdateService,
    private readonly logger: LoggerService,
    private readonly i18n: CustomI18nService,
  ) {
    this.bot = this.botService.bot;
    this.initBot();
    // this.autoupdateService.initCronjobs();
  }

  private async initBot() {
    if (this.isUnderConstruction) {
      this.logger.log(LogsTypes.TgBotStart, 'isUnderConstruction');
    } else {
      const usersCount = (await this.usersService.findAllWithOrders()).length;
      this.logger.log(LogsTypes.TgBotStart, `UsersWithOrders: ${usersCount}`);
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

    this.bot.catch((e) => {
      this.logger.error(LogsTypes.Error, '=== BOT CATCH ===', { error: e });
    });
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
          this.messageService.sendMessage(user, 'default');
      }
    } catch (e) {
      this.logger.error(LogsTypes.Error, e);
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
    await this.messageService.sendMessage(
      user,
      this.i18n.t('user.message_start'),
    );
  }

  private async handleUserFaqBase(ctx: TgContext, user: User) {
    this.logger.log(LogsTypes.TgUserFaqBase, user.id);
    await this.messageService.sendMessage(
      user,
      this.i18n.t('user.message_faq_base'),
    );
  }

  private async handleUserFaqStatuses(ctx: TgContext, user: User) {
    this.logger.log(LogsTypes.TgUserFaqStatuses, user.id);
    await this.messageService.sendMessage(
      user,
      this.i18n.t('user.message_faq_statuses'),
    );
  }

  private async handleUserContacts(ctx: TgContext, user: User) {
    this.logger.log(LogsTypes.TgUserContacts, user.id);
    await this.messageService.sendMessage(
      user,
      this.i18n.t('user.message_contacts') + this.i18n.t('user.message_donate'),
    );
  }

  private async handleUserSchedule(ctx: TgContext, user: User) {
    this.logger.log(LogsTypes.TgUserSchedule, user.id);
    await this.messageService.sendMessage(
      user,
      this.i18n.t('user.message_autoupdate_schedules'),
    );
  }

  private async handleUserUnsubscribe(ctx: TgContext, user: User) {
    await this.messageService.sendMessageInline(user);
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

      await this.messageService.sendMessage(
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
      await this.messageService.sendMessageStatus(
        user,
        existingOrder,
        'subscribedAlready',
      );
      return;
    }

    const order = await this.ordersService.create({ uid }, user);
    const updatedUser = await this.usersService.find(ctx.from);

    if (order) {
      this.logger.log(LogsTypes.TgUserSubscribed, updatedUser.id, { order });
      await this.messageService.sendMessageStatus(
        updatedUser,
        order,
        'subscribed',
      );
      return;
    }

    this.logger.log(LogsTypes.ErrorOrderValidate, updatedUser.id, { order });
    await this.messageService.sendMessage(
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
        await this.messageService.sendMessageStatus(user, existingOrder);
      } else {
        this.logger.error(LogsTypes.ErrorOrderNotFound, uid, { user });
        await this.messageService.sendMessage(
          user,
          this.i18n.t('user_errors.message_order_not_found'),
        );
      }
      return;
    }

    this.logger.log(LogsTypes.ErrorOrderValidate, uid, { user });
    await this.messageService.sendMessage(
      user,
      this.i18n.t('user_errors.message_order_validate'),
    );
  }

  private async handleAdminSend(ctx: TgContext) {
    const userId = ctx.message.text.split(' ')[1];
    const userToSend = await this.usersService.find({ id: userId });
    const messageToUser = ctx.message.text.split(' ').slice(2).join(' ');

    await this.messageService.sendMessage(userToSend, messageToUser, {
      disable_notification: true,
    });
  }

  private async handleAdminTest(ctx: TgContext, user: User) {
    await this.messageService.sendMessage(user, 'Тестовая команда для админа');
  }
}
