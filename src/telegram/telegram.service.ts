import { Injectable } from '@nestjs/common';
import { START_CRONJOB_IMMEDIATELY } from 'src/constants';
import { Telegraf } from 'telegraf';

import { LogsTypes } from 'src/enums';
import { LoggerService } from 'src/logger/logger.service';
import { UsersService } from 'src/users/users.service';
import { CustomI18nService } from 'src/i18n/custom-i18n.service';
import { OrdersService } from 'src/orders/orders.service';

@Injectable()
export class TelegramService {
  private bot: Telegraf;

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
    this.bot.start((ctx) => this.handleBotStart(ctx));

    this.bot.on('text', (ctx) => this.handleBotText(ctx));

    this.bot.catch((e) => {
      console.error('=== BOT CATCH ===', e);
    });
  }

  private async handleBotStart(ctx) {
    const res = await this.usersService.create(ctx.from);
    console.warn(res);
  }

  private async handleBotText(ctx) {
    try {
      console.warn(ctx.from);
      const user = await this.usersService.find(ctx.from);
      console.warn(user);
    } catch (e) {
      this.logger.error(LogsTypes.Error, e);
    }
  }

  startBot() {
    if (START_CRONJOB_IMMEDIATELY) {
      this.bot.launch();
      // autoUpdateUsers();
      console.log('BOT STARTED WITH START_CRONJOB_IMMEDIATELY');
    } else {
      // getUsersWithCodes().then((data) => {
      this.bot.launch();
      this.logger.log(LogsTypes.BotStart, 'Успешщно');
      // console.log('BOT STARTED! UsersWithCodes:', data.length);
      // })
    }
  }
}
