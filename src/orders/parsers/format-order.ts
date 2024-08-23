import { daysPassed } from 'src/orders/constants/day-passed';
import { Order } from 'src/orders/entity/order.entity';

export const formatOrder = (order: Order) => ({
  ...order,
  statusPercent: order.statusPercent === null ? '-' : order.statusPercent,
  statusName: order.statusName === null ? '-' : order.statusName,
  statusInternalName: order.statusInternalName === null ? '-' : order.statusInternalName,
  updatedAtTimeString: order.updatedAtTimeString,
  daysPassed: daysPassed(order),
});
