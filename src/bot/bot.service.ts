// eslint-disable-next-line @typescript-eslint/no-var-requires
const rateLimit = require('telegraf-ratelimit');

import { Injectable } from '@nestjs/common';
import { TG_OWNER_ID, TG_RATE_LIMIT } from 'src/constants';
import { BotCommands } from 'src/enums';
import { CustomI18nService } from 'src/i18n/custom-i18n.service';
import { Context, NarrowedContext, Telegraf, session } from 'telegraf';
import {
  CallbackQuery,
  Message,
  Update,
} from 'telegraf/typings/core/types/typegram';

interface SessionData {
  awaitingSupportMessage: boolean;
}

export interface AppContext extends Context {
  session?: SessionData;
  message: Update.New & Update.NonChannel & Message.TextMessage;
}

export type AppContextAction = NarrowedContext<
  Context<Update> & {
    match: RegExpExecArray;
  },
  Update.CallbackQueryUpdate<CallbackQuery>
>;

@Injectable()
export class BotService {
  public bot: Telegraf;
  private isUnderConstruction: boolean =
    process.env.IS_UNDER_CONSTRUCTION === 'true';

  constructor(private readonly i18n: CustomI18nService) {
    const rateLimitMiddleware = rateLimit({
      window: TG_RATE_LIMIT,
      limit: 1,
      onLimitExceeded: (ctx) => {
        // ctx.reply(this.i18n.t('user_errors.message_rate_limit'));
        this.notify(this.i18n.t('admin.user_spaming', { id: ctx.from.id }));
      },
    });

    this.bot = new Telegraf<AppContext>(process.env.TG_BOT_TOKEN, {
      telegram: { webhookReply: false },
    });
    this.bot.use(rateLimitMiddleware);
    this.bot.use(
      session({ defaultSession: () => ({ awaitingSupportMessage: false }) }),
    );
  }

  get botCommands() {
    return Object.values(BotCommands).map((command) => {
      return {
        command,
        description: this.i18n.t(`user.command_${command}`),
      };
    });
  }

  async notify(message: string) {
    try {
      await this.bot.telegram.sendMessage(TG_OWNER_ID, message, {
        parse_mode: 'HTML',
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
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
