import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  IsDateString,
  IsNotEmpty,
  Min,
  Max,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePromoCodeDto {
  @ApiProperty({ example: 'SUMMER25' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[A-Z0-9_-]+$/, {
    message: 'Code must be uppercase letters, numbers, hyphens or underscores',
  })
  code: string;

  @ApiProperty({ example: 25, description: 'Discount percentage 1–100' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  discountPercent: number;

  @ApiProperty({ example: 100, description: 'Maximum number of uses' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUses: number;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class ValidatePromoCodeDto {
  @ApiProperty({ example: 'SUMMER25' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  eventId: number;
}
