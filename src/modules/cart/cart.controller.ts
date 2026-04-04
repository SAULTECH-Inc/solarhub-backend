import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';

@ApiTags('Cart')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly svc: CartService) {}

  @Get()
  getCart(@CurrentUser('id') uid: string) { return this.svc.getCart(uid); }

  @Post('items')
  addItem(@CurrentUser('id') uid: string, @Body() body: { productId: string; quantity?: number }) {
    return this.svc.addItem(uid, body.productId, body.quantity || 1);
  }

  @Patch('items/:id')
  updateQty(@CurrentUser('id') uid: string, @Param('id') id: string, @Body('quantity') qty: number) {
    return this.svc.updateQty(uid, id, qty);
  }

  @Delete('items/:id')
  removeItem(@CurrentUser('id') uid: string, @Param('id') id: string) {
    return this.svc.removeItem(uid, id);
  }

  @Delete()
  clearCart(@CurrentUser('id') uid: string) {
    return this.svc.clearCart(uid);
  }

  @Post('merge')
  mergeCart(@CurrentUser('id') uid: string, @Body('sessionId') sessionId: string) {
    return this.svc.mergeGuestCart(uid, sessionId);
  }
}
