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

@Entity()
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

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'userId' })
  user: User;
}
