import type { LogType } from 'src/logger/constants/log-types';

export interface FormatLogParams {
  level: string;
  message: any;
  logtype: LogType;
  meta?: unknown;
}
