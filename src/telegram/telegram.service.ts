import { Injectable } from '@nestjs/common';
import { START_CRONJOB_IMMEDIATELY } from 'src/constants';
import { Telegraf } from 'telegraf';
import { LoggerService } from 'src/logger/logger.service';
import { LogsTypes } from 'src/enums';
import { UserService } from 'src/user/user.service';
import { CustomI18nService } from 'src/i18n/custom-i18n.service';

@Injectable()
export class TelegramService {
  private bot: Telegraf;

  constructor(
    private readonly logger: LoggerService,
    private readonly i18n: CustomI18nService,
  ) {
    this.bot = new Telegraf(process.env.TG_BOT_TOKEN);
    this.initBot();
  }

  private initBot() {
    this.bot.start((ctx) => {
      ctx.reply('Welcome to the bot!');
    });

    this.bot.catch((e) => {
      console.error('=== BOT CATCH ===', e);
    });

    this.bot.on('text', async (ctx) => {
      ctx.reply(
        this.i18n.t('admin.new_user', {
          user: UserService.useFactory(ctx.from),
        }),
        {
          parse_mode: 'HTML',
        },
      );
    });
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
