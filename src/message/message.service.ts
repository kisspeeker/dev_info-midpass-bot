import { Injectable } from '@nestjs/common';
import { AppResponseService } from 'src/app-response/app-response.service';
import { BotService } from 'src/bot/bot.service';
import { LogsTypes } from 'src/enums';
import { CustomI18nService } from 'src/i18n/custom-i18n.service';
import { KeyboardService } from 'src/keyboard/keyboard.service';
import { Order } from 'src/orders/entity/order.entity';
import { OrdersService } from 'src/orders/orders.service';
import { User } from 'src/users/entity/user.entity';
import { Telegraf } from 'telegraf';

@Injectable()
export class MessageService {
  private bot: Telegraf;
  private adminId: string = process.env.TG_ADMIN_ID;

  constructor(
    private readonly botService: BotService,
    private readonly i18n: CustomI18nService,
    private readonly keyboardService: KeyboardService,
    private readonly appResponseService: AppResponseService,
    private readonly ordersService: OrdersService,
  ) {
    this.bot = this.botService.bot;
  }

  async checkBlockedUser(e, user: User) {
    const isBlockedUser =
      e &&
      e.response &&
      e.response.error_code &&
      e.on &&
      e.on.payload &&
      e.on.payload.chat_id;

    if (isBlockedUser) {
      await this.ordersService.deleteAll(user);
      return await this.appResponseService.error(
        LogsTypes.ErrorBlockByUser,
        e,
        {
          user,
        },
      );
    }
    return false;
  }

  async sendMessage(
    user: User,
    message: string,
    extra: {
      disable_notification?: boolean;
    } = {},
  ) {
    try {
      await this.bot.telegram.sendMessage(user.id, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...this.keyboardService.useKeyboardDefault(user),
        ...extra,
      });
      return this.appResponseService.success(LogsTypes.TgMessageSent, user.id, {
        user,
      });
    } catch (e) {
      const isBlockerUser = await this.checkBlockedUser(e, user);

      if (isBlockerUser) {
        return isBlockerUser;
      }
      return this.appResponseService.error(LogsTypes.ErrorUserSendMessage, e, {
        user,
      });
    }
  }

  async sendMessageInlineOrders(user: User) {
    try {
      await this.bot.telegram.sendMessage(
        user.id,
        user.filteredOrders.length
          ? this.i18n.t('user.message_orders_list')
          : this.i18n.t('user.message_orders_list_empty'),
        {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          ...this.keyboardService.useKeyboardInlineOrders(user),
        },
      );
      return this.appResponseService.success(LogsTypes.TgOrdersSent, user.id);
    } catch (e) {
      const isBlockerUser = await this.checkBlockedUser(e, user);

      if (isBlockerUser) {
        return isBlockerUser;
      }
      return this.appResponseService.error(
        LogsTypes.ErrorUserSendMessageInlineOrders,
        e,
      );
    }
  }

  async sendMessageInlineUnsubscribe(user: User) {
    try {
      await this.bot.telegram.sendMessage(
        user.id,
        this.i18n.t('user.message_unsubscribe'),
        {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          ...this.keyboardService.useKeyboardInlineUnsubscribe(user),
        },
      );
      return this.appResponseService.success(
        LogsTypes.TgUnsubscribeSent,
        user.id,
      );
    } catch (e) {
      const isBlockerUser = await this.checkBlockedUser(e, user);

      if (isBlockerUser) {
        return isBlockerUser;
      }
      return this.appResponseService.error(
        LogsTypes.ErrorUserSendMessageInlineUnsubscribe,
        e,
      );
    }
  }

  async sendMessageStatus(
    user: User,
    order: Order,
    type?: 'changed' | 'subscribed' | 'subscribedAlready',
  ) {
    try {
      const image = await OrdersService.getStatusImage(order);
      const orderBeauty = this.i18n.t('user.message_status_order_beauty', {
        order: order.formatBeauty,
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
          ...this.keyboardService.useKeyboardDefault(user),
        },
      );
      return this.appResponseService.success(LogsTypes.TgStatusSent, user.id);
    } catch (e) {
      const isBlockerUser = await this.checkBlockedUser(e, user);

      if (isBlockerUser) {
        return isBlockerUser;
      }
      return this.appResponseService.error(
        LogsTypes.ErrorUserSendMessageStatus,
        e,
      );
    }
  }
}
