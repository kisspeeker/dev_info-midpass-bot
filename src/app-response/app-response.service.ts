import { Injectable } from '@nestjs/common';
import { LogsTypes } from 'src/enums';
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

@Injectable()
export class AppResponseService {
  constructor(private readonly logger: LoggerService) {}

  public success<T>(data: T): AppResponseSuccess<T> {
    return {
      success: true,
      data,
    };
  }

  public error<T>(
    type: LogsTypes,
    message: string,
    data?: T,
    meta?: unknown,
  ): AppResponseError<T> {
    this.logger.error(type, message, meta);

    return {
      success: false,
      error: type,
      message,
      data,
    };
  }
}
