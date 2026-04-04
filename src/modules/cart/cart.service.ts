import {
  Injectable, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './cart.entity';
import { ProductsService } from '../products/products.service';
import { RedisService } from '../redis/redis.service';

export interface CartSummary {
  items:     CartItem[];
  itemCount: number;
  subtotal:  number;
  currency:  string;
}

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem) private readonly repo: Repository<CartItem>,
    private readonly products: ProductsService,
    private readonly redis: RedisService,
  ) {}

  // ── Add / Update ──────────────────────────────────────────
  async addItem(userId: string, productId: string, quantity = 1): Promise<CartSummary> {
    const product = await this.products.findById(productId);
    if (product.stock < quantity) {
      throw new BadRequestException(`Only ${product.stock} units available`);
    }

    const existing = await this.repo.findOne({ where: { userId, productId } });
    if (existing) {
      const newQty = existing.quantity + quantity;
      if (product.stock < newQty) throw new BadRequestException('Not enough stock');
      await this.repo.update(existing.id, { quantity: newQty });
    } else {
      await this.repo.save(
        this.repo.create({ userId, productId, quantity, priceAtAdd: product.price }),
      );
    }
    await this.redis.del(`cart:${userId}`);
    return this.getCart(userId);
  }

  async updateQty(userId: string, itemId: string, quantity: number): Promise<CartSummary> {
    const item = await this.repo.findOne({ where: { id: itemId, userId }, relations: ['product'] });
    if (!item) throw new NotFoundException('Cart item not found');
    if (quantity < 1) {
      await this.repo.delete(itemId);
    } else {
      if (item.product.stock < quantity) throw new BadRequestException('Not enough stock');
      await this.repo.update(itemId, { quantity });
    }
    await this.redis.del(`cart:${userId}`);
    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string): Promise<CartSummary> {
    await this.repo.delete({ id: itemId, userId });
    await this.redis.del(`cart:${userId}`);
    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<void> {
    await this.repo.delete({ userId });
    await this.redis.del(`cart:${userId}`);
  }

  // ── Get ───────────────────────────────────────────────────
  async getCart(userId: string): Promise<CartSummary> {
    const items = await this.repo.find({
      where: { userId },
      relations: ['product', 'product.category'],
      order: { createdAt: 'ASC' },
    });

    const subtotal = items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
    const itemCount = items.reduce((s, i) => s + i.quantity, 0);
    return { items, itemCount, subtotal, currency: 'NGN' };
  }

  // ── Merge guest cart on login ─────────────────────────────
  async mergeGuestCart(userId: string, sessionId: string): Promise<void> {
    const guestItems = await this.repo.find({ where: { sessionId } });
    for (const gi of guestItems) {
      const existing = await this.repo.findOne({ where: { userId, productId: gi.productId } });
      if (existing) {
        await this.repo.update(existing.id, { quantity: existing.quantity + gi.quantity });
        await this.repo.delete(gi.id);
      } else {
        await this.repo.update(gi.id, { userId, sessionId: null });
      }
    }
    await this.redis.del(`cart:${userId}`);
  }

  async getItemsForOrder(userId: string): Promise<CartItem[]> {
    return this.repo.find({
      where: { userId },
      relations: ['product'],
    });
  }
}
