import { Injectable } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';

import { BotCommands, LogsTypes, TextCommands } from 'src/enums';
import { CustomI18nService } from 'src/i18n/custom-i18n.service';
import { OrdersService } from 'src/orders/orders.service';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entity/user.entity';
import { MessageService } from 'src/message/message.service';
import { AppContext, AppContextAction, BotService } from 'src/bot/bot.service';
import { AutoupdateService } from 'src/autoupdate/autoupdate.service';
import { AppResponseService } from 'src/app-response/app-response.service';
import { TelegramAdminService } from 'src/telegram/telegram-admin.service';
import { TelegramUserService } from 'src/telegram/telegram-user.service';

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
    private readonly telegramAdminService: TelegramAdminService,
    private readonly telegramUserService: TelegramUserService,
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
      const usersCountResponse = await this.usersService.findAllFiltered();
      if (usersCountResponse.success) {
        const ordersCount = usersCountResponse.data.reduce(
          (acc, user) => (acc += user.filteredOrders.length),
          0,
        );
        this.appResponseService.success(LogsTypes.TgBotStart, null, null, {
          usersCount: usersCountResponse.data.length,
          ordersCount,
          isUnderConstruction: false,
        });
      }
    }

    this.bot.start(async (ctx) => {
      await this.handleUserEvent(ctx, TgEvents.Start);
    });

    for (const command of this.botService.botCommands) {
      this.bot.command(command.command, async (ctx) => {
        await this.handleUserEvent(ctx, command.command);
      });
    }

    this.bot.on(message('text'), async (ctx) => {
      await this.handleUserEvent(ctx, TgEvents.Text);
    });

    this.bot.action(/unsubscribe (.+)/, async (ctx) => {
      await this.handleUserEvent(ctx, TgEvents.ActionUnsubscribe);
    });

    this.bot.action(/status (.+)/, async (ctx) => {
      await this.handleUserEvent(ctx, TgEvents.ActionStatus);
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
        await this.telegramUserService.handleStart(ctx as AppContext, user);
        break;
      case BotCommands.Support:
        await this.telegramUserService.handleSupport(ctx as AppContext, user);
        break;
      case BotCommands.FaqBase:
        await this.telegramUserService.handleFaqBase(ctx as AppContext, user);
        break;
      case BotCommands.FaqStatuses:
        await this.telegramUserService.handleFaqStatuses(
          ctx as AppContext,
          user,
        );
        break;
      case BotCommands.Contacts:
        await this.telegramUserService.handleContacts(ctx as AppContext, user);
        break;
      case BotCommands.Schedule:
        await this.telegramUserService.handleSchedule(ctx as AppContext, user);
        break;
      case BotCommands.OrdersList:
        await this.telegramUserService.handleOrdersList(
          ctx as AppContext,
          user,
        );
        break;
      case TgEvents.ActionStatus:
        await this.telegramUserService.handleActionStatus(
          ctx as AppContextAction,
          user,
        );
        await ctx.answerCbQuery(this.i18n.t('user.answer_cb_success'));
        break;
      case TgEvents.ActionUnsubscribe:
        await this.telegramUserService.handleActionUnsubscribe(
          ctx as AppContextAction,
          user,
        );
        await ctx.answerCbQuery(this.i18n.t('user.answer_cb_success'));
        break;
      case TgEvents.Text:
        await this.handleUserText(ctx as AppContext, user);
        break;
      default:
        await this.handleUserText(ctx as AppContext, user);
        break;
    }
  }

  private async handleUserText(ctx: AppContext, user: User) {
    const text = String(ctx.message?.text).toLowerCase();
    const textCommand = String(text.split(' ')[0]).trim();

    try {
      switch (textCommand) {
        case TextCommands.Unsubscribe:
          await this.telegramUserService.handleUnsubscribe(ctx, user);
          break;
        case TextCommands.Status:
        case TextCommands.StatusUpdate:
          await this.telegramUserService.handleStatus(ctx, user);
          break;
        case TextCommands.Admin:
        case TextCommands.Admin1:
          await this.telegramAdminService.handleCommands(ctx, user);
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
            await this.telegramUserService.handleSubscribe(ctx, user);
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

  private async handleCheckUnderConstruction(
    ctx: AppContext | AppContextAction,
  ) {
    if (this.isUnderConstruction) {
      await this.bot.telegram.sendMessage(
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
}
