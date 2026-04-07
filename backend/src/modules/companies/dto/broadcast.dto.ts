import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsEnum,
  IsOptional,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum BroadcastRecipients {
  ALL_SUBSCRIBERS  = 'all_subscribers',
  EVENT_ATTENDEES  = 'event_attendees',
}

export enum BroadcastDelivery {
  IN_APP = 'in_app',
  EMAIL  = 'email',
  BOTH   = 'both',
}

export class BroadcastNotificationDto {
  @ApiProperty({ example: 'Special announcement!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'We have exciting news to share with you…' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({ enum: BroadcastRecipients })
  @IsEnum(BroadcastRecipients)
  recipients: BroadcastRecipients;

  @ApiProperty({ enum: BroadcastDelivery })
  @IsEnum(BroadcastDelivery)
  delivery: BroadcastDelivery;

  @ApiPropertyOptional({
    example: 1,
    description: 'Required when recipients = event_attendees',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  eventId?: number;
}
