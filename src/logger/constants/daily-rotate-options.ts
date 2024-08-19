import { DailyRotateFileTransportOptions } from 'winston-daily-rotate-file';

export const DAILY_ROTATE_OPTIONS: DailyRotateFileTransportOptions = {
  filename: 'logs/%DATE%-midpass-bot.log',
  datePattern: 'YYYY-MM-DD',
  utc: true,
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '6m',
};
