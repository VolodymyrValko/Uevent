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
import { Event } from './event.entity';

@Entity('event_subscriptions')
@Unique(['userId', 'eventId'])
@Index(['userId'])
@Index(['eventId'])
export class EventSubscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'event_id' })
  eventId: number;

  @ApiProperty()
  @CreateDateColumn({ name: 'subscribed_at', type: 'timestamptz' })
  subscribedAt: Date;

  @ManyToOne(() => User, (user) => user.eventSubscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Event, (event) => event.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;
}
