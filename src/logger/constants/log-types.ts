import { LogAutoupdate } from 'src/logger/enums/log-autoupdate';
import { LogDb } from 'src/logger/enums/log-db';
import { LogError } from 'src/logger/enums/log-error';
import { LogOrder } from 'src/logger/enums/log-order';
import { LogTg } from 'src/logger/enums/log-tg';

export type LogType = ValueOf<typeof LogLevelTypes>;

export const LogLevelTypes = {
  ...LogAutoupdate,
  ...LogDb,
  ...LogError,
  ...LogOrder,
  ...LogTg,
};
