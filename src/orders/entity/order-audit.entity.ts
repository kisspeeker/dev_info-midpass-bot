import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';
import { DB_AUDIT_ORDER_TABLE_NAME } from 'src/constants/db-audit-order-table-name';

@Entity({ name: DB_AUDIT_ORDER_TABLE_NAME })
export class OrderAudit extends Order {
  constructor() {
    super();
    delete this.audits;
    this.createdAt = new Date();
  }

  @PrimaryGeneratedColumn()
    id: string;

  @ManyToOne(() => Order, order => order.audits)
  @JoinColumn({ name: 'orderUid' })
    order: Order;
}
