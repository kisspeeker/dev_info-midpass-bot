import { Order } from 'src/orders/entity/order.entity';
import { isValidDate } from 'src/utils';

export const parseUidDate = (uid: Order['uid']) => {
  const [, , year, month, day] = String(uid).match(
    /^(\d{9})(\d{4})(\d{2})(\d{2})/,
  );
  const result = `${year}-${month}-${day}`;
  
  return isValidDate(result) && result;
};
