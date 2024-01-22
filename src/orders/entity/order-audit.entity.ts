import { getLocaleDateString } from 'src/utils';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity({ name: 'midpass_order_audit' })
export class OrderAudit {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  orderUid: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  receptionDate: string;

  @Column({ nullable: true })
  oldStatusId: number;

  @Column({ nullable: true })
  newStatusId: number;

  @Column({ nullable: true })
  oldStatusName: string;

  @Column({ nullable: true })
  newStatusName: string;

  @Column({ nullable: true })
  oldStatusInternalName: string;

  @Column({ nullable: true })
  newStatusInternalName: string;

  @Column({ nullable: true })
  oldStatusPercent: number;

  @Column({ nullable: true })
  newStatusPercent: number;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Order, (order) => order.audits)
  @JoinColumn({ name: 'orderUid' })
  order: Order;

  get updatedAtTimeString() {
    return getLocaleDateString(this.updatedAt);
  }
}
