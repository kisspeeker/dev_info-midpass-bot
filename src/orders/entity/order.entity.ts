import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
  BeforeInsert,
  OneToMany,
  BeforeUpdate,
} from 'typeorm';
import { User } from 'src/users/entity/user.entity';
import { calculateDaysDifference, getLocaleDateString } from 'src/utils';
import { OrderAudit } from './order-audit.entity';
import { DbActions } from 'src/enums';

@Entity({ name: 'midpass_order' })
export class Order {
  @PrimaryColumn()
  uid: string;

  @Column()
  shortUid: string;

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

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => OrderAudit, (audit) => audit.order)
  audits: OrderAudit[];

  // private originalValue: Order;

  get isNew() {
    return this.statusPercent === null;
  }

  get updatedAtTimeString() {
    return getLocaleDateString(this.updatedAt);
  }

  get daysPassed() {
    const days = calculateDaysDifference(this.receptionDate);
    return Number.isNaN(days) ? '-' : days;
  }

  get formatBeauty() {
    return {
      ...this,
      statusPercent: this.statusPercent === null ? '-' : this.statusPercent,
      statusName: this.statusName === null ? '-' : this.statusName,
      statusInternalName:
        this.statusInternalName === null ? '-' : this.statusInternalName,
      updatedAtTimeString: this.updatedAtTimeString,
      daysPassed: this.daysPassed,
    };
  }

  @BeforeUpdate()
  setDefaultsOnUpdate() {
    // this.updatedAt = new Date();
    // this.createAuditRecord('UPDATE');
  }

  private createAuditRecord(action: DbActions) {
    const auditRecord = new OrderAudit();
    // auditRecord.order = this;
    // auditRecord.action = action;
    // auditRecord.oldValue = JSON.stringify(this.originalValues);
    // auditRecord.newValue = JSON.stringify({ ...this, updatedAt: new Date() });

    // orderUid: newOrder.uid,
    // userId,
    // oldStatusId: oldOrder?.statusId,
    // newStatusId: newOrder.statusId,
    // oldStatusName: oldOrder?.statusName,
    // newStatusName: newOrder.statusName,
    // oldStatusInternalName: oldOrder?.statusInternalName,
    // newStatusInternalName: newOrder.statusInternalName,
    // oldStatusPercent: oldOrder?.statusPercent,
    // newStatusPercent: newOrder.statusPercent,
    // isDeleted: newOrder.isDeleted,

    this.audits.push(auditRecord);
  }
}
