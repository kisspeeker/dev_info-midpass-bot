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
import { calculateDaysDifference } from 'src/utils';

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

  @Column({ default: '-' })
  statusName: string;

  @Column({ nullable: true })
  statusDescription: string;

  @Column({ nullable: true })
  statusColor: string;

  @Column({ nullable: true })
  statusSubscription: boolean;

  @Column({ default: '-' })
  statusInternalName: string;

  @Column({ default: 0 })
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

  get updatedAtTimeString() {
    return new Date(this.updatedAt).toLocaleString('ru-RU', {
      timeStyle: 'medium',
      dateStyle: 'short',
      timeZone: 'Europe/Moscow',
    });
  }

  get daysPassed() {
    const days = calculateDaysDifference(this.receptionDate);
    return Number.isNaN(days) ? '-' : days;
  }
}
