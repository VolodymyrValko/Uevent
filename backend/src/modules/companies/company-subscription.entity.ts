import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../users/user.entity';
import { Company } from './company.entity';

@Entity('company_subscriptions')
@Unique(['userId', 'companyId'])
@Index(['userId'])
@Index(['companyId'])
export class CompanySubscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'company_id' })
  companyId: number;

  @ApiProperty()
  @CreateDateColumn({ name: 'subscribed_at', type: 'timestamptz' })
  subscribedAt: Date;

  @ManyToOne(() => User, (user) => user.companySubscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Company, (company) => company.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;
}
