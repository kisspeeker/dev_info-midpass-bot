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
  ) {
    this.bot = this.botService.bot;
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
    } catch (e) {
      this.appResponseService.error(LogsTypes.ErrorUserSendMessage, e);
    }
  }
  async sendMessageToAdmin(message: string) {
    try {
      await this.bot.telegram.sendMessage(this.adminId, message, {
        parse_mode: 'HTML',
      });
    } catch (e) {
      this.appResponseService.error(LogsTypes.ErrorUserSendMessage, e);
    }
  }

  async sendMessageInline(user: User) {
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
    } catch (e) {
      this.appResponseService.error(LogsTypes.ErrorUserSendMessageInline, e);
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
    } catch (e) {
      this.appResponseService.error(LogsTypes.ErrorUserSendMessageStatus, e);
    }
  }
}
