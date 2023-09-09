import { Injectable } from '@nestjs/common';
import { Telegraf } from 'telegraf';

import {
  AdminCommands,
  AdminCommandsDescription,
  LogsTypes,
  TextCommands,
} from 'src/enums';
import { CustomI18nService } from 'src/i18n/custom-i18n.service';
import { OrdersService } from 'src/orders/orders.service';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entity/user.entity';
import { MessageService } from 'src/message/message.service';
import { AppContext, BotService } from 'src/bot/bot.service';
import { AutoupdateService } from 'src/autoupdate/autoupdate.service';
import { AppResponseService } from 'src/app-response/app-response.service';

@Injectable()
export class TelegramAdminService {
  private bot: Telegraf;

  constructor(
    private readonly botService: BotService,
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
    private readonly messageService: MessageService,
    private readonly autoupdateService: AutoupdateService,
    private readonly i18n: CustomI18nService,
    private readonly appResponseService: AppResponseService,
  ) {
    this.bot = this.botService.bot;
  }

  async handleCommands(ctx: AppContext, user: User) {
    if (!user.isAdmin) {
      return;
    }

    const text = String(ctx.message.text).toLowerCase();
    const textCommand = text.split(' ')[1]?.trim();

    try {
      switch (textCommand) {
        case AdminCommands.User:
          await this.handleShowUser(ctx);
          break;
        case AdminCommands.Order:
          await this.handleShowOrder(ctx);
          break;
        case AdminCommands.Audit:
          await this.handleShowOrderAudit(ctx);
          break;
        case AdminCommands.Send:
          await this.handleSend(ctx);
          break;
        case AdminCommands.Block:
          await this.handleBlock(ctx);
          break;
        case AdminCommands.Block:
          await this.handleBlock(ctx);
          break;
        case AdminCommands.Unblock:
          await this.handleUnblock(ctx);
          break;
        default:
          if (!textCommand) {
            await this.handleShowList();
            break;
          }
          await this.botService.notify(
            this.i18n.t('admin.error_command_not_found'),
          );
      }
    } catch (e) {
      this.appResponseService.error(LogsTypes.Error, e);
    }
  }

  async handleShowList() {
    const message = Object.entries(AdminCommandsDescription)
      .map(
        ([command, description]) =>
          `<code>${TextCommands.Admin} ${command} </code> \n <em>${description}</em>`,
      )
      .join('\n\n');

    await this.botService.notify(message);
  }

  async handleFindUser(userIdOrUsername: string) {
    try {
      const userResponse = await this.usersService.find({
        id: userIdOrUsername,
        username: userIdOrUsername,
      });

      if (!userResponse.success) {
        return;
      }

      return userResponse.data;
    } catch (e) {
      throw e;
    }
  }

  async handleShowUser(ctx: AppContext) {
    const userIdOrUsername = ctx.message.text.split(' ')[2];

    try {
      const user = await this.handleFindUser(userIdOrUsername);
      const messageUser = this.i18n.t('admin.tg_show_user', { user });
      await this.botService.notify(messageUser);
      for (let i = 0; i < user.orders.length; i++) {
        await this.botService.notify(
          this.messageService.getMessageStatus(user.orders[i], undefined, true),
        );
      }
    } catch (e) {
      this.appResponseService.error(
        e,
        this.i18n.t('admin.error_show_user', { userIdOrUsername }),
        { userIdOrUsername },
        { userIdOrUsername },
      );
    }
  }

  async handleShowOrder(ctx: AppContext) {
    const uid = ctx.message.text.split(' ')[2];

    try {
      const orderResponse = await this.ordersService.find(uid);

      if (!orderResponse.success) {
        return;
      }
      const order = orderResponse.data;
      const message = this.messageService.getMessageStatus(
        order,
        undefined,
        true,
      );

      await this.botService.notify(message);
    } catch (e) {
      this.appResponseService.error(
        e,
        this.i18n.t('admin.error_show_order', { uid }),
      );
    }
  }

  async handleShowOrderAudit(ctx: AppContext) {
    const uid = ctx.message.text.split(' ')[2];

    try {
      const orderAuditLogs = await this.ordersService.findAuditLogs(uid);
      const pageSize = 10;

      for (let i = 0; i < orderAuditLogs.length; i += pageSize) {
        const group = orderAuditLogs.slice(i, i + pageSize);

        const message = group
          .map((orderAuditLog) =>
            this.i18n.t('admin.order_audit_log_beauty', { orderAuditLog }),
          )
          .join(this.i18n.t('admin.separator'));

        await this.botService.notify(message);
      }
    } catch (e) {
      this.appResponseService.error(
        e,
        this.i18n.t('admin.error_show_order', { uid }),
      );
    }
  }

  async handleBlock(ctx: AppContext) {
    const userId = ctx.message.text.split(' ')[2];
    await this.usersService.block({ id: userId });
  }

  async handleUnblock(ctx: AppContext) {
    const userId = ctx.message.text.split(' ')[2];
    await this.usersService.unblock({ id: userId });
  }

  async handleSend(ctx: AppContext) {
    const userIdOrUsername = ctx.message.text.split(' ')[2];
    const messageToUser = ctx.message.text.split(' ').slice(3).join(' ');

    try {
      const userToSend = await this.handleFindUser(userIdOrUsername);

      const messageResponse = await this.messageService.sendMessage(
        userToSend,
        messageToUser,
        {
          disable_notification: true,
        },
      );
      if (messageResponse.success === true) {
        await this.appResponseService.success(
          LogsTypes.TgAdminMessageSent,
          userToSend.id,
          null,
          { user: userToSend, messageToUser },
        );
      }
    } catch (e) {
      this.appResponseService.error(
        e,
        this.i18n.t('admin.error_user_send_message', { userIdOrUsername }),
        { userIdOrUsername },
        { userIdOrUsername },
      );
    }
  }
}
