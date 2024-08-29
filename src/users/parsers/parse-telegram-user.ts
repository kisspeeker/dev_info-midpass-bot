import { TelegramUser } from 'src/types/telegram-user';
import { User } from 'src/users/entity/user.entity';

export const parseTelegramUser = ({ id, first_name, last_name, username }: TelegramUser): Partial<User> => ({
  id: String(id),
  firstName: first_name,
  lastName: last_name,
  userName: username ? `@${username}` : '',
});
