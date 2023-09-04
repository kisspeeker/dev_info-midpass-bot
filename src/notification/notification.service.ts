import { Injectable } from '@nestjs/common';
import { BotService } from 'src/bot/bot.service';
import { Telegraf } from 'telegraf';

@Injectable()
export class NotificationService {
  private bot: Telegraf;
  private adminId: string = process.env.TG_ADMIN_ID;

  constructor(private readonly botService: BotService) {
    this.bot = this.botService.bot;
  }

  async sendMessageToAdmin(message: string) {
    try {
      await this.bot.telegram.sendMessage(this.adminId, message, {
        parse_mode: 'HTML',
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}
