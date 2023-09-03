import { Injectable } from '@nestjs/common';
import { BotCommands } from 'src/enums';
import { Telegraf } from 'telegraf';

@Injectable()
export class BotService {
  public bot: Telegraf;
  private isUnderConstruction: boolean =
    process.env.IS_UNDER_CONSTRUCTION === 'true';

  constructor() {
    this.bot = new Telegraf(process.env.TG_BOT_TOKEN);
  }

  get botCommands() {
    return [
      {
        command: BotCommands.Start,
        description: 'Команда для старта',
      },
      {
        command: BotCommands.Help,
        description: 'Как пользоваться ботом',
      },
      {
        command: BotCommands.FaqBase,
        description: 'Как пользоваться ботом',
      },
      {
        command: BotCommands.FaqStatuses,
        description: 'Значения статусов заявлений',
      },
      {
        command: BotCommands.Schedule,
        description: 'Расписание автообновления заявлений',
      },
      {
        command: BotCommands.Contacts,
        description: 'Контакты автора для вопросов и предложений',
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
