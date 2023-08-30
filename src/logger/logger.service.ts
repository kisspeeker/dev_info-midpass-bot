import { Injectable } from '@nestjs/common';
import { createLogger, transports, format } from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

import { LogsTypes } from 'src/enums';

@Injectable()
export class LoggerService {
  private logger = createLogger({
    format: format.combine(
      format.printf(({ level, message, logtype, meta }) => {
        const date = new Intl.DateTimeFormat('ru-RU', {
          timeStyle: 'medium',
          dateStyle: 'short',
          timeZone: 'Europe/Moscow',
        })
          .format()
          .replace(/\./g, '-');

        const metaString = meta ? `META<<<${JSON.stringify(meta)}>>>META` : '';

        return `${date} мск / ${logtype} [${level}]: ${message} ${metaString}`;
      }),
    ),

    transports: [
      new transports.Console(), // Запись в консоль
      new DailyRotateFile({
        filename: 'logs/%DATE%-midpass-bot.log',
        datePattern: 'DD-MM-YYYY',
        utc: true,
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '6m',
      }),
    ],
  });

  log(logtype: LogsTypes, message: string, meta?: unknown) {
    this.logger.info(message, { logtype, meta });
    // if (sendToAdmin) {
    //   // TODO: sendToAdmin
    // }
  }

  error(logtype: LogsTypes, message: string, meta?: unknown) {
    this.logger.error(message, { logtype, meta });
    // if (sendToAdmin) {
    //   // TODO: sendToAdmin
    // }
  }

  warn(logtype: LogsTypes, message: string, meta?: unknown) {
    this.logger.warn(message, { logtype, meta });
    // if (sendToAdmin) {
    //   // TODO: sendToAdmin
    // }
  }
}
