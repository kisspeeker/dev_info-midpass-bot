// eslint-disable-next-line @typescript-eslint/no-var-requires
const rateLimit = require('telegraf-ratelimit');

import { Injectable } from '@nestjs/common';
import { TG_RATE_LIMIT } from 'src/constants';
import { BotCommands } from 'src/enums';
import { CustomI18nService } from 'src/i18n/custom-i18n.service';
import { Telegraf } from 'telegraf';

@Injectable()
export class BotService {
  public bot: Telegraf;
  private isUnderConstruction: boolean =
    process.env.IS_UNDER_CONSTRUCTION === 'true';

  constructor(private readonly i18n: CustomI18nService) {
    const rateLimitMiddleware = rateLimit({
      window: TG_RATE_LIMIT,
      limit: 1,
      onLimitExceeded: (ctx) =>
        ctx.reply(this.i18n.t('user_errors.message_rate_limit')),
    });

    this.bot = new Telegraf(process.env.TG_BOT_TOKEN);
    this.bot.use(rateLimitMiddleware);
  }

  get botCommands() {
    return [
      {
        command: BotCommands.Start,
        description: this.i18n.t('user.command_start'),
      },
      {
        command: BotCommands.Help,
        description: this.i18n.t('user.command_help'),
      },
      {
        command: BotCommands.FaqBase,
        description: this.i18n.t('user.command_faq'),
      },
      {
        command: BotCommands.FaqStatuses,
        description: this.i18n.t('user.command_statuses'),
      },
      {
        command: BotCommands.Schedule,
        description: this.i18n.t('user.command_schedule'),
      },
      {
        command: BotCommands.Contacts,
        description: this.i18n.t('user.command_contacts'),
      },
    ];
  }

  async startBot() {
    if (this.isUnderConstruction) {
      this.bot.launch();
    } else {
      await this.bot.telegram.setMyCommands(this.botCommands);
      await this.bot.launch();
    }
  }
}
