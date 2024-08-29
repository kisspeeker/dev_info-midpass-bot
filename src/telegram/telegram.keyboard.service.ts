import { Injectable } from '@nestjs/common';
import { CustomI18nService } from 'src/i18n/custom-i18n.service';
import { User } from 'src/users/entity/user.entity';
import { Markup } from 'telegraf';
import {
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
} from 'telegraf/typings/core/types/typegram';

@Injectable()
export class KeyboardService {
  constructor(private readonly i18n: CustomI18nService) {}

  useKeyboardDefault(
    user: User,
  ): Markup.Markup<ReplyKeyboardMarkup> | Markup.Markup<ReplyKeyboardRemove> {
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

  useKeyboardInlineUnsubscribe(
    user: User,
  ): Markup.Markup<InlineKeyboardMarkup> {
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
  }

  useKeyboardInlineOrders(user: User): Markup.Markup<InlineKeyboardMarkup> {
    const res = [];
    if (user && user.filteredOrders.length) {
      user.filteredOrders.forEach((order) =>
        res.push([
          Markup.button.callback(
            this.i18n.t('user.button_status_order', { order }),
            `status ${order.uid}`,
          ),
        ]),
      );
    }
    return res.length ? Markup.inlineKeyboard.bind(this)(res).resize() : [];
  }
}
