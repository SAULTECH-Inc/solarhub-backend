import {
  Injectable, NotFoundException, BadRequestException,
  ForbiddenException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderItem, OrderStatus, PaymentStatus } from './order.entity';
import { CartService } from '../cart/cart.service';
import { ProductsService } from '../products/products.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RedisService } from '../redis/redis.service';
import {
  generateOrderId, generateTrackingCode,
  paginate, paginationToSkipTake,
} from '../../common/utils/pagination.util';

interface CreateOrderDto {
  deliveryAddress: Order['deliveryAddress'];
  deliveryMethod: string;
  deliveryFee?: number;
  paymentMethod?: string;
  buyerNote?: string;
  currency?: string;
}

const STATUS_FLOW: Record<string, OrderStatus> = {
  [OrderStatus.PENDING]:      OrderStatus.CONFIRMED,
  [OrderStatus.CONFIRMED]:    OrderStatus.PROCESSING,
  [OrderStatus.PROCESSING]:   OrderStatus.DISPATCHED,
  [OrderStatus.DISPATCHED]:   OrderStatus.IN_TRANSIT,
  [OrderStatus.IN_TRANSIT]:   OrderStatus.OUT_DELIVERY,
  [OrderStatus.OUT_DELIVERY]: OrderStatus.DELIVERED,
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order) private readonly repo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly itemRepo: Repository<OrderItem>,
    private readonly cart: CartService,
    private readonly products: ProductsService,
    private readonly notif: NotificationsService,
    private readonly redis: RedisService,
  ) {}

  // ── Place order ───────────────────────────────────────────
  async placeOrder(buyerId: string, dto: CreateOrderDto, buyer: any): Promise<Order> {
    const cartItems = await this.cart.getItemsForOrder(buyerId);
    if (!cartItems.length) throw new BadRequestException('Cart is empty');

    // Validate stock for all items
    for (const ci of cartItems) {
      if (ci.product.stock < ci.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${ci.product.name}". Available: ${ci.product.stock}`
        );
      }
    }

    const subtotal = cartItems.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
    const deliveryFee = dto.deliveryFee || 3500;
    const total = subtotal + deliveryFee;

    const daysToDelivery = dto.deliveryMethod === 'express' ? 1 : 3;
    const estimatedDelivery = new Date(Date.now() + daysToDelivery * 86400000);

    const order = await this.repo.save(
      this.repo.create({
        orderNumber: generateOrderId(),
        buyerId,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        subtotal, deliveryFee, total, discount: 0,
        currency: dto.currency || 'NGN',
        deliveryAddress: dto.deliveryAddress,
        deliveryMethod: dto.deliveryMethod || 'standard',
        estimatedDelivery,
        trackingCode: generateTrackingCode(),
        buyerNote: dto.buyerNote,
        paymentMethod: dto.paymentMethod || 'online',
        statusHistory: [{
          status: OrderStatus.PENDING,
          timestamp: new Date().toISOString(),
          note: 'Order placed by customer',
        }],
        items: cartItems.map(ci => this.itemRepo.create({
          productId:    ci.productId,
          sellerId:     ci.product.sellerId,
          productName:  ci.product.name,
          productImage: ci.product.thumbnail,
          productSlug:  ci.product.slug,
          unitPrice:    ci.product.price,
          quantity:     ci.quantity,
          subtotal:     Number(ci.product.price) * ci.quantity,
          status:       OrderStatus.PENDING,
        })),
      }),
    );

    // Decrement stock
    for (const ci of cartItems) {
      await this.products.decrementStock(ci.productId, ci.quantity);
    }

    // Clear cart
    await this.cart.clearCart(buyerId);

    // Notify
    const orderData = {
      id: order.id,
      orderNumber: order.orderNumber,
      itemCount: cartItems.length,
      total: order.total,
      deliveryAddress: `${dto.deliveryAddress.address}, ${dto.deliveryAddress.city}, ${dto.deliveryAddress.state}`,
      estimatedDelivery: estimatedDelivery.toDateString(),
      trackingUrl: `${process.env.FRONTEND_URL}/orders/${order.id}`,
      items: cartItems.map(ci => ({
        name:     ci.product.name,
        qty:      ci.quantity,
        subtotal: (Number(ci.product.price) * ci.quantity).toLocaleString(),
      })),
    };

    await this.notif.sendOrderConfirmation(buyer, orderData);
    this.logger.log(`Order placed: ${order.orderNumber} by ${buyerId}`);
    return order;
  }

  // ── Get orders ────────────────────────────────────────────
  async findById(id: string, userId?: string, role?: string): Promise<Order> {
    const order = await this.repo.findOne({
      where: { id },
      relations: ['buyer'],
    });
    if (!order) throw new NotFoundException('Order not found');
    if (userId && order.buyerId !== userId && role !== 'admin') {
      throw new ForbiddenException('Access denied');
    }
    return order;
  }

  async getUserOrders(buyerId: string, page: number, limit: number, status?: OrderStatus) {
    const where: any = { buyerId };
    if (status) where.status = status;
    const { skip, take } = paginationToSkipTake(page, limit);
    const [data, total] = await this.repo.findAndCount({
      where, skip, take, order: { createdAt: 'DESC' },
    });
    return paginate(data, total, page, limit);
  }

  async getSellerOrders(sellerId: string, page: number, limit: number) {
    const { skip, take } = paginationToSkipTake(page, limit);
    const qb = this.repo.createQueryBuilder('o')
      .innerJoin('o.items', 'i', 'i.sellerId = :sid', { sid: sellerId })
      .leftJoinAndSelect('o.buyer', 'b')
      .addSelect('o.items')
      .skip(skip).take(take).orderBy('o.createdAt', 'DESC');
    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async getAllOrders(page: number, limit: number, status?: string, search?: string) {
    const qb = this.repo.createQueryBuilder('o')
      .leftJoinAndSelect('o.buyer', 'b');
    if (status) qb.where('o.status = :status', { status });
    if (search) qb.andWhere('o.orderNumber ILIKE :q', { q: `%${search}%` });
    const { skip, take } = paginationToSkipTake(page, limit);
    qb.skip(skip).take(take).orderBy('o.createdAt', 'DESC');
    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  // ── Status management ─────────────────────────────────────
  async advanceStatus(
    orderId: string,
    userId: string,
    role: string,
    note?: string,
  ): Promise<Order> {
    const order = await this.findById(orderId);
    const next = STATUS_FLOW[order.status];
    if (!next) throw new BadRequestException(`Order is already ${order.status}`);

    // Sellers can only advance their portion; admins can advance any
    if (role !== 'admin') {
      const sellerItem = order.items?.find(i => i.sellerId === userId);
      if (!sellerItem) throw new ForbiddenException('You have no items in this order');
    }

    const history = [
      ...(order.statusHistory || []),
      { status: next, timestamp: new Date().toISOString(), note, updatedBy: userId },
    ];

    const updates: Partial<Order> = { status: next, statusHistory: history };
    if (next === OrderStatus.DELIVERED) updates.deliveredAt = new Date();

    await this.repo.update(orderId, updates);

    // Notify buyer
    const buyer = await this.repo.findOne({ where: { id: orderId }, relations: ['buyer'] });
    if (buyer?.buyer) {
      await this.notif.sendOrderStatusUpdate(buyer.buyer, {
        id: orderId, orderNumber: order.orderNumber,
      }, next);
    }

    return this.findById(orderId);
  }

  async cancelOrder(orderId: string, userId: string, role: string, reason?: string): Promise<Order> {
    const order = await this.findById(orderId);
    if (order.buyerId !== userId && role !== 'admin') throw new ForbiddenException('Access denied');
    if ([OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REFUNDED].includes(order.status)) {
      throw new BadRequestException(`Cannot cancel order in status: ${order.status}`);
    }

    await this.repo.update(orderId, {
      status: OrderStatus.CANCELLED,
      cancelReason: reason,
      cancelledAt: new Date(),
      statusHistory: [
        ...(order.statusHistory || []),
        { status: OrderStatus.CANCELLED, timestamp: new Date().toISOString(), note: reason },
      ],
    });

    // Restock
    for (const item of order.items || []) {
      await this.products.decrementStock(item.productId, -item.quantity); // negative = restore
    }

    return this.findById(orderId);
  }

  async markPaid(orderId: string, reference: string, gateway: string): Promise<Order> {
    const order = await this.findById(orderId);
    await this.repo.update(orderId, {
      paymentStatus: PaymentStatus.PAID,
      paymentReference: reference,
      paymentGateway: gateway,
      status: OrderStatus.CONFIRMED,
      statusHistory: [
        ...(order.statusHistory || []),
        { status: OrderStatus.CONFIRMED, timestamp: new Date().toISOString(), note: 'Payment confirmed' },
      ],
    });
    return this.findById(orderId);
  }

  async getOrderStats() {
    const statuses = Object.values(OrderStatus);
    const counts = await Promise.all(
      statuses.map(s => this.repo.count({ where: { status: s } }).then(c => ({ [s]: c }))),
    );
    const total = await this.repo.count();
    const revenue = await this.repo
      .createQueryBuilder('o')
      .where('o.paymentStatus = :ps', { ps: PaymentStatus.PAID })
      .select('SUM(o.total)', 'total')
      .getRawOne();
    return { total, revenue: Number(revenue?.total || 0), byStatus: Object.assign({}, ...counts) };
  }
}
