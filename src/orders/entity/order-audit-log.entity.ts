import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class OrderAuditLog {
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
}
