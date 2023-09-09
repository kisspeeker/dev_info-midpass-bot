import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/users/entity/user.entity';
import { calculateDaysDifference, getLocaleDateString } from 'src/utils';

@Entity()
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
}
