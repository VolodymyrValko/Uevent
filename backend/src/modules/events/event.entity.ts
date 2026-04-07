import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../companies/company.entity';
import { Ticket } from '../tickets/ticket.entity';
import { Comment } from '../comments/comment.entity';
import { PromoCode } from './promo-code.entity';
import { EventSubscription } from './event-subscription.entity';

export enum EventFormat {
  CONFERENCE = 'conference',
  LECTURE = 'lecture',
  WORKSHOP = 'workshop',
  FEST = 'fest',
  OTHER = 'other',
}

export enum EventTheme {
  BUSINESS = 'business',
  POLITICS = 'politics',
  PSYCHOLOGY = 'psychology',
  TECHNOLOGY = 'technology',
  SCIENCE = 'science',
  ENTERTAINMENT = 'entertainment',
  OTHER = 'other',
}

export enum VisitorListVisibility {
  EVERYONE = 'everyone',
  ATTENDEES_ONLY = 'attendees_only',
}

@Entity('events')
@Index(['date'])
@Index(['companyId'])
@Index(['format'])
@Index(['theme'])
export class Event {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'TypeScript Summit 2025' })
  @Column({ length: 200 })
  title: string;

  @ApiProperty({ example: 'Join us for the biggest TypeScript conference.' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ enum: EventFormat })
  @Column({ type: 'enum', enum: EventFormat })
  format: EventFormat;

  @ApiProperty({ enum: EventTheme })
  @Column({ type: 'enum', enum: EventTheme })
  theme: EventTheme;

  @ApiProperty({ example: '2025-09-15T10:00:00Z' })
  @Column({ type: 'timestamptz' })
  date: Date;

  @ApiProperty({ example: '2025-08-01T00:00:00Z', nullable: true })
  @Column({ name: 'publish_date', type: 'timestamptz', nullable: true })
  publishDate: Date | null;

  @ApiProperty({ example: 'Kyiv, Ukraine, Arena City' })
  @Column({ length: 500 })
  location: string;

  @ApiProperty({ example: 50.4501 })
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @ApiProperty({ example: 30.5234 })
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @ApiProperty({ example: '29.99', description: '0 = free' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @ApiProperty({ example: 500 })
  @Column({ name: 'max_tickets' })
  maxTickets: number;

  @ApiProperty({ example: 142 })
  @Column({ name: 'tickets_sold', default: 0 })
  ticketsSold: number;

  @ApiProperty({ example: '/uploads/poster-1.jpg', nullable: true })
  @Column({ type: 'varchar', length: 500, nullable: true })
  poster: string | null;

  @ApiProperty({ enum: VisitorListVisibility, default: VisitorListVisibility.EVERYONE })
  @Column({
    name: 'visitor_list_visibility',
    type: 'enum',
    enum: VisitorListVisibility,
    default: VisitorListVisibility.EVERYONE,
  })
  visitorListVisibility: VisitorListVisibility;

  @ApiProperty({ example: false })
  @Column({ name: 'notify_on_new_visitor', default: false })
  notifyOnNewVisitor: boolean;

  @ApiProperty({ example: 'https://myapp.com/thank-you', nullable: true })
  @Column({ name: 'redirect_after_purchase', type: 'varchar', length: 500, nullable: true })
  redirectAfterPurchase: string | null;

  @Column({ name: 'company_id' })
  companyId: number;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Company, (company) => company.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @OneToMany(() => Ticket, (ticket) => ticket.event)
  tickets: Ticket[];

  @OneToMany(() => Comment, (comment) => comment.event)
  comments: Comment[];

  @OneToMany(() => PromoCode, (promo) => promo.event)
  promoCodes: PromoCode[];

  @OneToMany(() => EventSubscription, (sub) => sub.event)
  subscriptions: EventSubscription[];
}
