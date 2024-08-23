import { Order } from 'src/orders/entity/order.entity';
import { MidpassOrder } from 'src/orders/types/midpass-order';

export const parseMidpassOrder = (raw: MidpassOrder): Partial<Order> => ({
  sourceUid: raw.sourceUid,
  receptionDate: raw.receptionDate,
  statusId: raw.passportStatus.passportStatusId,
  statusName: raw.passportStatus.name,
  statusDescription: raw.passportStatus.description,
  statusColor: raw.passportStatus.color,
  statusSubscription: raw.passportStatus.subscription,
  statusInternalName: raw.internalStatus.name,
  statusPercent: raw.internalStatus.percent,
  userId: raw.userId,
});
