import rateLimit from 'telegraf-ratelimit';

import { Injectable } from '@nestjs/common';
import { IS_UNDER_CONSTRUCTION } from 'src/constants/is-under-construction';
import { TG_BOT_TOKEN } from 'src/constants/tg-bot-token';
import { TG_OWNER_ID } from 'src/constants/tg-owner-id';
import { TG_RATE_LIMIT } from 'src/constants/tg-rate-limit';
import { CmdBot } from 'src/enums/cmd/cmd-bot';
import { CustomI18nService } from 'src/i18n/custom-i18n.service';
import { AppContext } from 'src/types/app-context';
import { Telegraf, session } from 'telegraf';

@Injectable()
export class BotService {
  public bot: Telegraf;

  public constructor(private readonly i18n: CustomI18nService) {
    this.bot = new Telegraf<AppContext>(TG_BOT_TOKEN, {
      telegram: { webhookReply: false },
    });
    this.bot.use(this.createRateLimitMiddleware());
    this.bot.use(this.createDefaultBotSession());
  }

  private get botCommands() {
    return Object.values(CmdBot).map(command => ({
      command,
      description: this.i18n.t(`user.command_${command}`),
    }));
  }

  private createRateLimitMiddleware() {
    return rateLimit({
      window: TG_RATE_LIMIT,
      limit: 1,
      onLimitExceeded: ctx => {
        // ctx.reply(this.i18n.t('user_errors.message_rate_limit'));
        this.notify(this.i18n.t('admin.user_spaming', { id: ctx.from.id }));
      },
    });
  }

  private createDefaultBotSession() {
    return session({
      defaultSession: () => ({ awaitingSupportMessage: false }),
    });
  }

  public async notify(message: string) {
    return this.bot.telegram.sendMessage(TG_OWNER_ID, message, {
      parse_mode: 'HTML',
    });
  }

  public async startBot() {
    if (!IS_UNDER_CONSTRUCTION) {
      await this.bot.telegram.setMyCommands(this.botCommands);
    }

    return this.bot.launch();
  }
}
