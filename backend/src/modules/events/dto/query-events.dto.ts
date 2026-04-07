import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsString,
  IsDateString,
  IsIn,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { EventFormat, EventTheme } from '../event.entity';

export class QueryEventsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: EventFormat })
  @IsOptional()
  @IsEnum(EventFormat)
  format?: EventFormat;

  @ApiPropertyOptional({ enum: EventTheme })
  @IsOptional()
  @IsEnum(EventTheme)
  theme?: EventTheme;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ example: 'TypeScript' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['date', 'price', 'title'], default: 'date' })
  @IsOptional()
  @IsIn(['date', 'price', 'title'])
  sortBy?: 'date' | 'price' | 'title' = 'date';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'asc';
}
