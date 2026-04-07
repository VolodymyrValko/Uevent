import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '../users/user.entity';

class CreateCheckoutDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  eventId: number;

  @ApiPropertyOptional({ example: 'SUMMER25' })
  @IsOptional()
  @IsString()
  promoCode?: string;
}

class MockPayDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  eventId: number;

  @ApiProperty({ example: 24.99 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 'SUMMER25' })
  @IsOptional()
  @IsString()
  promoCode?: string;
}

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-checkout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create Stripe checkout session (or mock URL on localhost)' })
  @ApiResponse({ status: 201, description: 'Checkout session created or mock URL returned' })
  createCheckout(@Body() dto: CreateCheckoutDto, @GetUser() user: User) {
    return this.paymentsService.createCheckoutSession(dto.eventId, user, dto.promoCode);
  }

  @Post('mock-pay')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Mock payment for localhost development — simulates Stripe checkout',
    description: 'Accepts any price value and creates a ticket. Use instead of Stripe in dev.',
  })
  @ApiResponse({ status: 200, description: 'Ticket created, confirmation email sent' })
  mockPay(@Body() dto: MockPayDto, @GetUser() user: User) {
    return this.paymentsService.mockPay(dto.eventId, user, dto.price, dto.promoCode);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook endpoint — do not call manually' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(req.rawBody as Buffer, signature);
  }
}
