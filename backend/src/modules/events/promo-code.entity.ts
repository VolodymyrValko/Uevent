import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Event } from '../events/event.entity';

@Entity('promo_codes')
@Index(['code'], { unique: true })
@Index(['eventId'])
export class PromoCode {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'SUMMER25' })
  @Column({ unique: true, length: 50 })
  code: string;

  @ApiProperty({ example: 25, description: 'Discount percentage 1–100' })
  @Column({ name: 'discount_percent' })
  discountPercent: number;

  @Column({ name: 'event_id' })
  eventId: number;

  @ApiProperty({ example: 100 })
  @Column({ name: 'max_uses' })
  maxUses: number;

  @ApiProperty({ example: 0 })
  @Column({ name: 'current_uses', default: 0 })
  currentUses: number;

  @ApiProperty({ example: '2025-12-31T23:59:59Z', nullable: true })
  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Event, (event) => event.promoCodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;
}
