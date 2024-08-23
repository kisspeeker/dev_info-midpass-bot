import { ORDER_COMPLETE_PERCENTS } from 'src/constants/order-complete-percents';
import { ORDER_COMPLETE_STATUSES } from 'src/constants/order-complete-statuses';
import { Order } from 'src/orders/entity/order.entity';

export const isCompleteOrder = ({ statusPercent, statusInternalName }: Order) =>
  ORDER_COMPLETE_PERCENTS.includes(statusPercent) &&
  ORDER_COMPLETE_STATUSES.includes(statusInternalName);
