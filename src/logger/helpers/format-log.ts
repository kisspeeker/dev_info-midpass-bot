import type { LogType } from 'src/logger/constants/log-types';
import { getLocaleDateStringFormatted } from 'src/utils';

interface TransformableInfo {
  level: string;
  message: any;
  logtype: LogType;
  meta?: unknown;
}

/**
 * TODO: изменить текст лога
 */
export const formatLog = ({
  level,
  message,
  logtype,
  meta,
}: TransformableInfo) => {
  const date = getLocaleDateStringFormatted();

  const metaString = meta ? `META<<<${JSON.stringify(meta)}>>>META` : '';

  return `${date} мск / ${logtype} [${level}]: ${message} ${metaString}`;
};
