import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ example: 'TechConf Inc.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'info@techconf.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'We organize world-class tech events.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Kyiv, Ukraine' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  location?: string;
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}
