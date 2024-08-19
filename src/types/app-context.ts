import { SessionData } from 'src/types/session-data';
import { Context } from 'telegraf';
import { Message, Update } from 'telegraf/typings/core/types/typegram';

export interface AppContext extends Context {
  session?: SessionData;
  message: Update.New & Update.NonChannel & Message.TextMessage;
}
