import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
  OneToMany,
  InsertEvent,
  AfterUpdate,
} from 'typeorm';
import { User } from 'src/users/entity/user.entity';
import { getLocaleDateString } from 'src/utils';
import { OrderAudit } from './order-audit.entity';
import { DB_ORDER_TABLE_NAME } from 'src/constants/db-order-table-name';
import { ORDER_UID_SHORT_LENGTH } from 'src/constants/order-uid-short-length';

@Entity({ name: DB_ORDER_TABLE_NAME })
export class Order {
  @PrimaryColumn()
  uid: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  sourceUid: string;

  @Column({ nullable: true })
  receptionDate: string;

  @Column({ nullable: true })
  statusId: number;

  @Column({ nullable: true })
  statusName: string;

  @Column({ nullable: true })
  statusDescription: string;

  @Column({ nullable: true })
  statusColor: string;

  @Column({ nullable: true })
  statusSubscription: boolean;

  @Column({ nullable: true })
  statusInternalName: string;

  @Column({ nullable: true })
  statusPercent: number;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.orders)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => OrderAudit, audit => audit.order)
  audits: OrderAudit[];

  get shortUid() {
    return `*${this.uid.slice(-ORDER_UID_SHORT_LENGTH)}`;
  }

  get isNew() {
    return this.statusPercent === null;
  }

  get updatedAtTimeString() {
    return getLocaleDateString(this.updatedAt);
  }

  @AfterUpdate()
  setDefaultsOnUpdate(event: InsertEvent<Order>) {
    const orderAudit = event.connection.manager.create(OrderAudit, this);
    event.connection.manager.save(orderAudit);
  }
}
