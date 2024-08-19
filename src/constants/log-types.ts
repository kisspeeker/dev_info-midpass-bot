import { LogAutoupdate } from 'src/enums/log/log-autoupdate';
import { LogDb } from 'src/enums/log/log-db';
import { LogError } from 'src/enums/log/log-error';
import { LogOrder } from 'src/enums/log/log-order';
import { LogTg } from 'src/enums/log/log-tg';

export const LogTypes = {
  ...LogAutoupdate,
  ...LogDb,
  ...LogError,
  ...LogOrder,
  ...LogTg,
};
