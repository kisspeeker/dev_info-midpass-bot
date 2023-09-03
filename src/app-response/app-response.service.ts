import { Global, Injectable } from '@nestjs/common';
import { LogsTypes } from 'src/enums';
import { LoggerService } from 'src/logger/logger.service';

export type AppResponse<T = unknown> = {
  success: boolean;
  data: T;
  error?: LogsTypes;
};

@Global()
@Injectable()
export class AppResponseService {
  constructor(private readonly logger: LoggerService) {}

  public success<T>(data: T): AppResponse<T> {
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
  ): AppResponse<T> {
    this.logger.error(type, message, meta);

    return {
      success: false,
      error: type,
      data,
    };
  }
}
