import { Order } from 'src/orders/entity/order.entity';

export const isDifferentOrders = (currentOrder: Order, newOrder: Order) => (
  currentOrder.statusPercent !== newOrder.statusPercent
  || currentOrder.statusName !== newOrder.statusName
  || currentOrder.statusInternalName !== newOrder.statusInternalName
);
