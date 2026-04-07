import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsUrl,
  MaxLength,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  EventFormat,
  EventTheme,
  VisitorListVisibility,
} from '../event.entity';

export class CreateEventDto {
  @ApiProperty({ example: 'TypeScript Summit 2025', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'Join 500+ developers for the biggest TS conference.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: EventFormat })
  @IsEnum(EventFormat)
  format: EventFormat;

  @ApiProperty({ enum: EventTheme })
  @IsEnum(EventTheme)
  theme: EventTheme;

  @ApiProperty({ example: '2025-09-15T10:00:00Z' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: '2025-08-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  publishDate?: string;

  @ApiProperty({ example: 'Kyiv, Ukraine, Arena City' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  location: string;

  @ApiPropertyOptional({ example: 50.4501 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 30.5234 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiProperty({ example: 29.99, description: '0 = free event' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 500 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxTickets: number;

  @ApiPropertyOptional({ enum: VisitorListVisibility })
  @IsOptional()
  @IsEnum(VisitorListVisibility)
  visitorListVisibility?: VisitorListVisibility;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  notifyOnNewVisitor?: boolean;

  @ApiPropertyOptional({ example: 'https://myapp.com/thank-you' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  redirectAfterPurchase?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-xxx' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  posterUrl?: string;

  @ApiProperty({ example: 1, description: 'ID of the company organizing this event' })
  @Type(() => Number)
  @IsNumber()
  companyId: number;
}

export class UpdateEventDto extends PartialType(CreateEventDto) {}
