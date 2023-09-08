import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Order } from 'src/orders/entity/order.entity';

@Entity()
export class User {
  private adminId: string = process.env.TG_ADMIN_ID;

  @PrimaryColumn()
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  userName: string;

  @Column({ nullable: true })
  isBlocked: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  get filteredOrders() {
    return this.orders.filter((order) => !order.isDeleted);
  }

  get isAdmin() {
    return this.id === this.adminId;
  }

  get ordersFormatBeauty() {
    return this.orders.map((order) => order.formatBeauty).join('\n\n');
  }
}
