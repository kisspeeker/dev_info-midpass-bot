import { Injectable } from '@nestjs/common';
import { BotService } from 'src/bot/bot.service';
import { LogsTypes } from 'src/enums';
import { CustomI18nService } from 'src/i18n/custom-i18n.service';
import { LoggerService } from 'src/logger/logger.service';

export type AppResponseSuccess<T> = {
  success: true;
  data: T;
};

export type AppResponseError<T> = {
  success: false;
  message: string;
  data?: T;
  error: LogsTypes;
};

const notifiedLogs = [
  LogsTypes.Error,
  LogsTypes.ErrorBotCatch,
  LogsTypes.ErrorMidpassTimeout,
  LogsTypes.ErrorAutoupdateRoot,
  LogsTypes.ErrorBlockByUser,
  LogsTypes.ErrorUserSendMessage,
  LogsTypes.ErrorUserSendMessageInlineOrders,
  LogsTypes.ErrorUserSendMessageInlineUnsubscribe,
  LogsTypes.ErrorUserSendMessageStatus,
  LogsTypes.ErrorUserCreate,
  LogsTypes.ErrorUsersFindAll,
  LogsTypes.ErrorUsersFindWithOrders,
  LogsTypes.ErrorUserNotFound,
  LogsTypes.ErrorUserNotAllowedToUpdateOrder,
  LogsTypes.ErrorOrderRequest,
  LogsTypes.ErrorOrderDelete,
  LogsTypes.ErrorOrderNotFound,
  LogsTypes.ErrorOrdersNotFound,
  LogsTypes.ErrorMaxOrdersPerUser,

  LogsTypes.DbUserCreated,
  LogsTypes.DbUserBlocked,
  LogsTypes.DbUserUnblocked,

  LogsTypes.TgAdminMessageSent,

  LogsTypes.TgBotStart,
  LogsTypes.TgUserUnsubscribed,
  LogsTypes.TgShowUser,

  LogsTypes.AutoupdateStart,
  LogsTypes.AutoupdateEnd,
];

@Injectable()
export class AppResponseService {
  constructor(
    private readonly logger: LoggerService,
    private readonly botService: BotService,
    private readonly i18n: CustomI18nService,
  ) {}

  private async eventHandler<T>(
    type: LogsTypes,
    message: string | unknown,
    data: T = null,
    meta?: unknown,
  ) {
    if (notifiedLogs.includes(type)) {
      const assignedData = Object.assign({}, { message }, data, meta, { type });
      await this.botService.notify(
        this.i18n.tExist(`admin.${type.toLowerCase()}`, assignedData),
      );
    }
  }

  public async success<T>(
    type: LogsTypes,
    message: string,
    data: T = null,
    meta?: unknown,
  ): Promise<AppResponseSuccess<T>> {
    this.logger.log(type, message, meta);
    this.eventHandler(type, message, data, meta);

    return {
      success: true,
      data,
    };
  }

  public async error<T>(
    type: LogsTypes,
    message: string,
    data?: T,
    meta?: unknown,
  ): Promise<AppResponseError<T>> {
    this.logger.error(type, message, meta);
    this.eventHandler(type, message, data, meta);

    return {
      success: false,
      error: type,
      message,
      data,
    };
  }
}
