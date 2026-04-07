import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../companies/company.entity';
import { Ticket } from '../tickets/ticket.entity';
import { Comment } from '../comments/comment.entity';
import { Notification } from '../notifications/notification.entity';
import { EventSubscription } from '../events/event-subscription.entity';
import { CompanySubscription } from '../companies/company-subscription.entity';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  @Column({ unique: true, length: 255 })
  email: string;

  @Exclude()
  @Column({ length: 255 })
  password: string;

  @ApiProperty({ example: 'John' })
  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', nullable: true })
  @Column({ type: 'varchar', nullable: true, length: 500 })
  avatar: string | null;

  @ApiProperty({ enum: UserRole, default: UserRole.USER })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @ApiProperty({ example: true })
  @Column({ name: 'show_name_in_events', default: true })
  showNameInEvents: boolean;

  @ApiProperty({ example: false })
  @Column({ name: 'is_email_confirmed', default: false })
  isEmailConfirmed: boolean;

  @Exclude()
  @Column({ name: 'email_confirmation_token', type: 'varchar', nullable: true, length: 255 })
  emailConfirmationToken: string | null;

  @Exclude()
  @Column({ name: 'refresh_token', type: 'varchar', nullable: true, length: 500 })
  refreshToken: string | null;

  @Exclude()
  @Column({ name: 'password_reset_token', type: 'varchar', nullable: true, length: 255 })
  passwordResetToken: string | null;

  @Exclude()
  @Column({ name: 'password_reset_expires', nullable: true, type: 'timestamptz' })
  passwordResetExpires: Date | null;

  @Exclude()
  @Column({ name: 'google_id', type: 'varchar', nullable: true, length: 255 })
  googleId: string | null;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => Company, (company) => company.owner, { nullable: true })
  company: Company | null;

  @OneToMany(() => Ticket, (ticket) => ticket.user)
  tickets: Ticket[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => EventSubscription, (sub) => sub.user)
  eventSubscriptions: EventSubscription[];

  @OneToMany(() => CompanySubscription, (sub) => sub.user)
  companySubscriptions: CompanySubscription[];
}
