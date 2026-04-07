import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../users/user.entity';

export enum NotificationType {
  TICKET_PURCHASED = 'ticket_purchased',
  EVENT_REMINDER = 'event_reminder',
  ORGANIZER_NEWS = 'organizer_news',
  NEW_VISITOR = 'new_visitor',
}

@Entity('notifications')
@Index(['userId'])
@Index(['isRead'])
export class Notification {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ApiProperty({ example: 'Your ticket is confirmed!' })
  @Column({ length: 255 })
  title: string;

  @ApiProperty({ example: 'You have successfully purchased a ticket for TypeScript Summit.' })
  @Column({ type: 'text' })
  body: string;

  @ApiProperty({ enum: NotificationType })
  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ example: false })
  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @ApiProperty({ example: 42, nullable: true, description: 'Related event id if applicable' })
  @Column({ name: 'related_event_id', type: 'int', nullable: true })
  relatedEventId: number | null;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
