import { In, Not } from 'typeorm';
import { ORDER_COMPLETE_PERCENTS } from 'src/constants/order-complete-percents';
import { ORDER_COMPLETE_STATUSES } from 'src/constants/order-complete-statuses';
import { Order } from 'src/orders/entity/order.entity';
import { FindOrderParams, FindUserParams } from 'src/types/filter-types';

export const filterActive = () => ({ isDeleted: false });
export const filterOrderRelations = () => ({ orders: true });
export const filterUserRelations = () => ({ users: true });
export const filterActiveStatusPercent = () => ({
  statusPercent: Not(In(ORDER_COMPLETE_PERCENTS)),
});
// TODO: проверить вариант без lowercase
export const filterActiveStatusName = () => ({
  statusInternalName: Not(In(ORDER_COMPLETE_STATUSES)),
});
// export const filterActiveStatusName = () => ({
//   statusInternalName: Raw(
//     alias => `LOWER(${alias}) NOT IN (:...ORDER_COMPLETE_STATUSES)`,
//     { ORDER_COMPLETE_STATUSES },
//   ),
// });

export const filterByActiveOrder = () => ({
  orders: {
    ...filterActive(),
    ...filterActiveStatusPercent(),
    ...filterActiveStatusName(),
  },
});

export const filterOrder = ({ uid, userId }: FindOrderParams) => ({ uid, userId });

export const filterOrderByUser = ({ userId, isDeleted = false }: {
  userId: Order['userId'];
  isDeleted?: Order['isDeleted'];
}) => ({ userId, isDeleted });

export const filterUser = ({ telegramUser: { id, username }, isOwner = false }: FindUserParams) => [
  { id: String(id), isOwner },
  { userName: username, isOwner },
];
