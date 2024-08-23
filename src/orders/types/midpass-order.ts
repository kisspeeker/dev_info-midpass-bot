import { OrderInternalStatus } from 'src/orders/types/order-internal-status';
import { OrderPassportStatus } from 'src/orders/types/order-passport-status';

export interface MidpassOrder {
  uid: string;
  sourceUid: string;
  receptionDate: string;
  passportStatus: OrderPassportStatus;
  internalStatus: OrderInternalStatus;
  userId: string;
}
