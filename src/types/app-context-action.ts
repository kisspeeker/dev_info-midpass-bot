import { Context, NarrowedContext } from 'telegraf';
import { CallbackQuery, Update } from 'telegraf/typings/core/types/typegram';

export type AppContextAction = NarrowedContext<
  Context<Update> & { match: RegExpExecArray },
  Update.CallbackQueryUpdate<CallbackQuery>
>;
