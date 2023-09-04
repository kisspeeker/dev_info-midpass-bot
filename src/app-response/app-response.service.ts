import { Injectable } from '@nestjs/common';
import { LogsTypes } from 'src/enums';
import { LoggerService } from 'src/logger/logger.service';
import { NotificationService } from 'src/notification/notification.service';

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

@Injectable()
export class AppResponseService {
  constructor(
    private readonly logger: LoggerService,
    private readonly notificationService: NotificationService,
  ) {}

  private async eventHandler(type: LogsTypes) {
    // await this.notificationService.sendMessageToAdmin(`${type}`);
    console.warn('eventHandler', type);
  }

  public async success<T>(
    type: LogsTypes,
    message: string,
    data: T,
    meta?: unknown,
  ): Promise<AppResponseSuccess<T>> {
    this.logger.log(type, message, meta);
    this.eventHandler(type);

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
    this.eventHandler(type);

    return {
      success: false,
      error: type,
      message,
      data,
    };
  }
}
