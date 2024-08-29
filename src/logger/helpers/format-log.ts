import { FormatLogParams } from 'src/logger/types/format-log-params';
import { getLocaleDateStringFormatted } from 'src/utils';

/**
 * TODO: изменить текст лога
 */
export const formatLog = ({ level, message, logtype, meta }: FormatLogParams) => {
  const date = getLocaleDateStringFormatted();
  const metaString = meta ? `META<<<${JSON.stringify(meta)}>>>META` : '';

  return `${date} мск / ${logtype} [${level}]: ${message} ${metaString}`;
};
