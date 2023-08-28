import { Injectable } from '@nestjs/common';
import { LogsTypes } from 'src/enums';
import { createLogger, transports, format } from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

@Injectable()
export class LoggerService {
  private logger = createLogger({
    format: format.combine(
      format.timestamp(),
      format.printf(({ level, message, logtype, meta }) => {
        const date = new Intl.DateTimeFormat('ru-RU', {
          timeStyle: 'medium',
          dateStyle: 'short',
          timeZone: 'Europe/Moscow',
        });

        const metaString = meta ? `META<<<${JSON.stringify(meta)}>>>META` : '';

        return `${date.format()} / ${logtype} [${level}]: ${message} ${metaString}`;
      }),
    ),
    transports: [
      new transports.Console(), // Запись в консоль
      new DailyRotateFile({
        filename: 'logs/%DATE%-midpass-bot.log', // Файлы будут называться вида 27-08-2023-info-midpass-bot.log
        datePattern: 'DD-MM-YYYY', // Паттерн для разделения файлов по датам
        zippedArchive: true, // Архивирование старых файлов
        maxSize: '20m', // Максимальный размер файла перед перезаписью
        maxFiles: '6m', // Сохранять файлы за последние 6 месяцев
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
