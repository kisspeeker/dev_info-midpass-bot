import { TelegramUser } from 'src/types/telegram-user';

export const getFilterFindUser = (
  { id, username }: TelegramUser,
  isOwner = false,
) => [
  { id: String(id), isOwner },
  { userName: username, isOwner },
];
