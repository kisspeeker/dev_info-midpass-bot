import { Injectable } from '@nestjs/common';
import { Telegraf } from 'telegraf';

import { LogsTypes } from 'src/enums';
import { CustomI18nService } from 'src/i18n/custom-i18n.service';
import { OrdersService } from 'src/orders/orders.service';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entity/user.entity';
import { MessageService } from 'src/message/message.service';
import { AppContext, AppContextAction, BotService } from 'src/bot/bot.service';
import { AutoupdateService } from 'src/autoupdate/autoupdate.service';
import { AppResponseService } from 'src/app-response/app-response.service';
import { TelegramAdminService } from 'src/telegram/telegram-admin.service';

@Injectable()
export class TelegramUserService {
  private bot: Telegraf;

  constructor(
    private readonly botService: BotService,
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
    private readonly messageService: MessageService,
    private readonly adminService: TelegramAdminService,
    private readonly autoupdateService: AutoupdateService,
    private readonly i18n: CustomI18nService,
    private readonly appResponseService: AppResponseService,
  ) {
    this.bot = this.botService.bot;
  }

  async handleStart(ctx: AppContext, user: User) {
    await this.appResponseService.success(LogsTypes.TgUserStart, user.id);
    await this.messageService.sendMessage(
      user,
      this.i18n.t('user.message_start'),
    );
  }

  async handleSupport(ctx: AppContext, user: User) {
    await this.appResponseService.success(LogsTypes.TgUserSupport, user.id);
    await this.messageService.sendMessage(
      user,
      this.i18n.t('user.message_support'),
    );
    ctx.session.awaitingSupportMessage = true;
  }

  async handleFaqBase(ctx: AppContext, user: User) {
    await this.appResponseService.success(LogsTypes.TgUserFaqBase, user.id);
    await this.messageService.sendMessage(
      user,
      this.i18n.t('user.message_faq_base'),
    );
  }

  async handleFaqStatuses(ctx: AppContext, user: User) {
    await this.appResponseService.success(LogsTypes.TgUserFaqStatuses, user.id);
    await this.messageService.sendMessage(
      user,
      this.i18n.t('user.message_faq_statuses'),
    );
  }

  async handleContacts(ctx: AppContext, user: User) {
    await this.appResponseService.success(LogsTypes.TgUserContacts, user.id);
    await this.messageService.sendMessage(
      user,
      this.i18n.t('user.message_contacts') + this.i18n.t('user.message_donate'),
    );
  }

  async handleSchedule(ctx: AppContext, user: User) {
    await this.appResponseService.success(LogsTypes.TgUserSchedule, user.id);
    await this.messageService.sendMessage(
      user,
      this.i18n.t('user.message_autoupdate_schedules'),
    );
  }

  async handleUnsubscribe(ctx: AppContext, user: User) {
    await this.messageService.sendMessageInlineUnsubscribe(user);
  }

  async handleActionUnsubscribe(ctx: AppContextAction, user: User) {
    const uid = ctx.match[1];

    const deletedOrderResponse = await this.ordersService.delete(uid, user);
    if (!deletedOrderResponse.success) {
      await this.messageService.sendMessage(
        user,
        this.i18n.t('user_errors.message_order_unsubscribe', {
          order: { uid },
        }),
      );
      return;
    }
    const deletedOrder = deletedOrderResponse.data;
    await this.appResponseService.success(
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

    await this.messageService.sendMessage(
      updatedUser,
      this.i18n.t('user.message_unsubscribe_success', {
        order: deletedOrder,
      }),
    );

    if (messageId) {
      await this.bot.telegram.deleteMessage(user.id, messageId);
    }
  }

  async handleSubscribe(ctx: AppContext, user: User) {
    const uid = String(ctx.message.text.split(' ')[0]).trim();
    const existingOrder = user.filteredOrders.find(
      (order) => order.uid === uid,
    );

    if (existingOrder) {
      await this.appResponseService.success(
        LogsTypes.TgUserSubscribedAlready,
        user.id,
        null,
        {
          order: existingOrder,
        },
      );
      await this.messageService.sendMessageStatus(
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
        await this.messageService.sendMessage(
          user,
          this.i18n.t('user_errors.message_max_orders_per_user', {
            count: user.filteredOrders.length,
          }),
        );
      } else {
        await this.messageService.sendMessage(
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
      await this.appResponseService.success(
        LogsTypes.TgUserSubscribed,
        updatedUser.id,
        null,
        { order },
      );
      await this.messageService.sendMessageStatus(
        updatedUser,
        order,
        'subscribed',
      );
      return;
    }
  }

  async handleOrdersList(ctx: AppContext, user: User) {
    await this.messageService.sendMessageInlineOrders(user);
  }

  async handleActionStatus(ctx: AppContextAction, user: User) {
    const uid = ctx.match[1];
    await this.handleStatus(uid, user);

    const messageId = ctx.update.callback_query.message.message_id;
    if (messageId) {
      await this.bot.telegram.deleteMessage(user.id, messageId);
    }
  }

  async handleStatus(ctxOrUid: string | AppContext, user: User) {
    const uid =
      typeof ctxOrUid === 'string'
        ? ctxOrUid
        : String(ctxOrUid?.message?.text.split(' ')[1].trim());

    if (OrdersService.isValidUid(uid) || OrdersService.isValidUidShort(uid)) {
      const existingOrder = user.filteredOrders.find(
        (order) => order.uid === uid || order.shortUid === uid,
      );

      if (existingOrder) {
        await this.appResponseService.success(
          LogsTypes.TgUserOrderStatus,
          user.id,
          null,
          {
            order: existingOrder,
          },
        );
        await this.messageService.sendMessageStatus(user, existingOrder);
      } else {
        await this.appResponseService.error(
          LogsTypes.ErrorOrderNotFound,
          uid,
          null,
          {
            user,
          },
        );
        await this.messageService.sendMessage(
          user,
          this.i18n.t('user_errors.message_order_not_found'),
        );
      }
      return;
    }

    await this.appResponseService.error(
      LogsTypes.ErrorOrderValidate,
      uid,
      null,
      {
        user,
      },
    );
    await this.messageService.sendMessage(
      user,
      this.i18n.t('user_errors.message_order_validate'),
    );
  }
}
