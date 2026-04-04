import {
  Controller, Get, Post, Param, Body,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { DeliveryTracking, TrackingEventType } from './delivery.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Public, Roles } from '../../common/decorators';

@ApiTags('Delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly svc: DeliveryService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get full tracking history for an order' })
  getTracking(@Param('orderId') orderId: string) {
    return this.svc.getTrackingHistory(orderId);
  }

  @Public()
  @Get('track/:code')
  @ApiOperation({ summary: 'Public tracking by tracking code' })
  trackByCode(@Param('code') code: string) {
    return this.svc.getByTrackingCode(code);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller')
  @Post('order/:orderId/event')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Add a tracking event (seller/admin)' })
  addEvent(
    @Param('orderId') orderId: string,
    @Body() body: {
      event: TrackingEventType;
      description?: string;
      location?: string;
      handlerName?: string;
    },
    @CurrentUser('id') uid: string,
  ) {
    return this.svc.addEvent(orderId, body.event, {
      ...body,
      updatedBy: uid,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/stats')
  getStats() { return this.svc.getDeliveryStats(); }
}
