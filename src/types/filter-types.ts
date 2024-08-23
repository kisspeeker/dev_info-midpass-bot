import { Order } from 'src/orders/entity/order.entity';
import { TelegramUser } from 'src/types/telegram-user';
// TODO: naming
export interface FindOrderParams {
  uid: Order['uid'];
  userId?: Order['userId'];
}

export interface FindUserOrderParams {
  uid: Order['uid'];
  userId: Order['userId'];
}

export interface FindUserParams {
  telegramUser: TelegramUser;
  isOwner?: boolean;
}
