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
import { Event } from '../events/event.entity';

export enum TicketStatus {
  ACTIVE = 'active',
  USED = 'used',
  CANCELLED = 'cancelled',
}

@Entity('tickets')
@Index(['userId'])
@Index(['eventId'])
@Index(['qrCode'], { unique: true })
export class Ticket {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'event_id' })
  eventId: number;

  @ApiProperty({ example: '2025-01-15T12:00:00Z' })
  @CreateDateColumn({ name: 'purchase_date', type: 'timestamptz' })
  purchaseDate: Date;

  @ApiProperty({ example: 'TKT-550e8400-e29b-41d4-a716-446655440000' })
  @Column({ name: 'qr_code', unique: true, length: 255 })
  qrCode: string;

  @ApiProperty({ example: '24.99' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty({ enum: TicketStatus, default: TicketStatus.ACTIVE })
  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.ACTIVE })
  status: TicketStatus;

  @ManyToOne(() => User, (user) => user.tickets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Event, (event) => event.tickets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;
}
