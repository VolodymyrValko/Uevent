import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../users/user.entity';
import { Event } from '../events/event.entity';
import { CompanySubscription } from './company-subscription.entity';

@Entity('companies')
export class Company {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'TechConf Inc.' })
  @Column({ length: 200 })
  name: string;

  @ApiProperty({ example: 'info@techconf.com' })
  @Column({ length: 255 })
  @Index()
  email: string;

  @ApiProperty({ example: 'We organize tech events worldwide.', nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ example: 'Kyiv, Ukraine', nullable: true })
  @Column({ type: 'varchar', length: 300, nullable: true })
  location: string | null;

  @ApiProperty({ example: 'https://example.com/logo.png', nullable: true })
  @Column({ type: 'varchar', length: 500, nullable: true })
  logo: string | null;

  @Column({ name: 'user_id' })
  userId: number;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToOne(() => User, (user) => user.company)
  @JoinColumn({ name: 'user_id' })
  owner: User;

  @OneToMany(() => Event, (event) => event.company)
  events: Event[];

  @OneToMany(() => CompanySubscription, (sub) => sub.company)
  subscriptions: CompanySubscription[];
}
