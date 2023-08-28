import { Order } from 'src/order/order.interface';

export interface User {
  id: string;
  firstName: string;
  first_name?: string;
  lastName: string;
  last_name?: string;
  userName: string;
  username?: string;
  orders: Order[];
}
