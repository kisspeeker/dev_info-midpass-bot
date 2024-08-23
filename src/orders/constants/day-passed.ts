import { Order } from 'src/orders/entity/order.entity';
import { calculateDaysDifference } from 'src/utils';

export const daysPassed = ({ receptionDate }: Order) => {
  const days = calculateDaysDifference(receptionDate);

  return Number.isNaN(days) ? '-' : days;
};
