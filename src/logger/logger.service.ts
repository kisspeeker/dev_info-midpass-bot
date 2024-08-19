import { Injectable } from '@nestjs/common';
import { createLogger, transports, format } from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

import { DAILY_ROTATE_OPTIONS } from 'src/logger/constants/daily-rotate-options';
import { formatLog } from 'src/logger/helpers/format-log';
import { LogType } from 'src/logger/constants/log-types';

@Injectable()
export class LoggerService {
  private logger = createLogger({
    format: format.combine(format.printf(formatLog)),

    transports: [
      new transports.Console(), // Запись в консоль
      new DailyRotateFile(DAILY_ROTATE_OPTIONS),
    ],
  });

  log(logtype: LogType, message: string, meta?: unknown) {
    this.logger.info(message, { logtype, meta });
  }

  error(logtype: LogType, message: string, meta?: unknown) {
    this.logger.error(message, { logtype, meta });
  }

  warn(logtype: LogType, message: string, meta?: unknown) {
    this.logger.warn(message, { logtype, meta });
  }
}
