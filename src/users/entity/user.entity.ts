import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Order } from 'src/orders/entity/order.entity';
import { DB_USER_TABLE_NAME } from 'src/constants/db-user-table-name';
import { TG_OWNER_ID } from 'src/constants/tg-owner-id';

@Entity({ name: DB_USER_TABLE_NAME })
export class User {
  @PrimaryColumn()
    id: string;

  @Column({ nullable: true })
    firstName: string;

  @Column({ nullable: true })
    lastName: string;

  @Column({ nullable: true })
    userName: string;

  @Column({ nullable: true })
    isBlocked: boolean;

  @CreateDateColumn()
    createdAt: Date;

  @UpdateDateColumn()
    updatedAt: Date;

  @OneToMany(() => Order, order => order.user)
    orders: Order[];

  get isOwner() {
    return this.id === TG_OWNER_ID;
  }

  // TODO: мб убрать отсюда
  get ordersFormatBeauty() {
    return this.orders.map(order => order.formatBeauty).join('\n\n');
  }

  get activeOrdersCount() {
    return this.orders.reduce((count, order) => {
      return order.isDeleted ? count : count + 1;
    }, 0);
  }
}
