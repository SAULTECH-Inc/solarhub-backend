"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var OrdersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("./order.entity");
const cart_service_1 = require("../cart/cart.service");
const products_service_1 = require("../products/products.service");
const notifications_service_1 = require("../notifications/notifications.service");
const redis_service_1 = require("../redis/redis.service");
const pagination_util_1 = require("../../common/utils/pagination.util");
const STATUS_FLOW = {
    [order_entity_1.OrderStatus.PENDING]: order_entity_1.OrderStatus.CONFIRMED,
    [order_entity_1.OrderStatus.CONFIRMED]: order_entity_1.OrderStatus.PROCESSING,
    [order_entity_1.OrderStatus.PROCESSING]: order_entity_1.OrderStatus.DISPATCHED,
    [order_entity_1.OrderStatus.DISPATCHED]: order_entity_1.OrderStatus.IN_TRANSIT,
    [order_entity_1.OrderStatus.IN_TRANSIT]: order_entity_1.OrderStatus.OUT_DELIVERY,
    [order_entity_1.OrderStatus.OUT_DELIVERY]: order_entity_1.OrderStatus.DELIVERED,
};
let OrdersService = OrdersService_1 = class OrdersService {
    constructor(repo, itemRepo, cart, products, notif, redis) {
        this.repo = repo;
        this.itemRepo = itemRepo;
        this.cart = cart;
        this.products = products;
        this.notif = notif;
        this.redis = redis;
        this.logger = new common_1.Logger(OrdersService_1.name);
    }
    async placeOrder(buyerId, dto, buyer) {
        const cartItems = await this.cart.getItemsForOrder(buyerId);
        if (!cartItems.length)
            throw new common_1.BadRequestException('Cart is empty');
        for (const ci of cartItems) {
            if (ci.product.stock < ci.quantity) {
                throw new common_1.BadRequestException(`Insufficient stock for "${ci.product.name}". Available: ${ci.product.stock}`);
            }
        }
        const subtotal = cartItems.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
        const deliveryFee = dto.deliveryFee || 3500;
        const total = subtotal + deliveryFee;
        const daysToDelivery = dto.deliveryMethod === 'express' ? 1 : 3;
        const estimatedDelivery = new Date(Date.now() + daysToDelivery * 86400000);
        const order = await this.repo.save(this.repo.create({
            orderNumber: (0, pagination_util_1.generateOrderId)(),
            buyerId,
            status: order_entity_1.OrderStatus.PENDING,
            paymentStatus: order_entity_1.PaymentStatus.PENDING,
            subtotal, deliveryFee, total, discount: 0,
            currency: dto.currency || 'NGN',
            deliveryAddress: dto.deliveryAddress,
            deliveryMethod: dto.deliveryMethod || 'standard',
            estimatedDelivery,
            trackingCode: (0, pagination_util_1.generateTrackingCode)(),
            buyerNote: dto.buyerNote,
            paymentMethod: dto.paymentMethod || 'online',
            statusHistory: [{
                    status: order_entity_1.OrderStatus.PENDING,
                    timestamp: new Date().toISOString(),
                    note: 'Order placed by customer',
                }],
            items: cartItems.map(ci => this.itemRepo.create({
                productId: ci.productId,
                sellerId: ci.product.sellerId,
                productName: ci.product.name,
                productImage: ci.product.thumbnail,
                productSlug: ci.product.slug,
                unitPrice: ci.product.price,
                quantity: ci.quantity,
                subtotal: Number(ci.product.price) * ci.quantity,
                status: order_entity_1.OrderStatus.PENDING,
            })),
        }));
        for (const ci of cartItems) {
            await this.products.decrementStock(ci.productId, ci.quantity);
        }
        await this.cart.clearCart(buyerId);
        const orderData = {
            id: order.id,
            orderNumber: order.orderNumber,
            itemCount: cartItems.length,
            total: order.total,
            deliveryAddress: `${dto.deliveryAddress.address}, ${dto.deliveryAddress.city}, ${dto.deliveryAddress.state}`,
            estimatedDelivery: estimatedDelivery.toDateString(),
            trackingUrl: `${process.env.FRONTEND_URL}/orders/${order.id}`,
            items: cartItems.map(ci => ({
                name: ci.product.name,
                qty: ci.quantity,
                subtotal: (Number(ci.product.price) * ci.quantity).toLocaleString(),
            })),
        };
        await this.notif.sendOrderConfirmation(buyer, orderData);
        this.logger.log(`Order placed: ${order.orderNumber} by ${buyerId}`);
        return order;
    }
    async findById(id, userId, role) {
        const order = await this.repo.findOne({
            where: { id },
            relations: ['buyer'],
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (userId && order.buyerId !== userId && role !== 'admin') {
            throw new common_1.ForbiddenException('Access denied');
        }
        return order;
    }
    async getUserOrders(buyerId, page, limit, status) {
        const where = { buyerId };
        if (status)
            where.status = status;
        const { skip, take } = (0, pagination_util_1.paginationToSkipTake)(page, limit);
        const [data, total] = await this.repo.findAndCount({
            where, skip, take, order: { createdAt: 'DESC' },
        });
        return (0, pagination_util_1.paginate)(data, total, page, limit);
    }
    async getSellerOrders(sellerId, page, limit) {
        const { skip, take } = (0, pagination_util_1.paginationToSkipTake)(page, limit);
        const qb = this.repo.createQueryBuilder('o')
            .innerJoin('o.items', 'i', 'i.sellerId = :sid', { sid: sellerId })
            .leftJoinAndSelect('o.buyer', 'b')
            .addSelect('o.items')
            .skip(skip).take(take).orderBy('o.createdAt', 'DESC');
        const [data, total] = await qb.getManyAndCount();
        return (0, pagination_util_1.paginate)(data, total, page, limit);
    }
    async getAllOrders(page, limit, status, search) {
        const qb = this.repo.createQueryBuilder('o')
            .leftJoinAndSelect('o.buyer', 'b');
        if (status)
            qb.where('o.status = :status', { status });
        if (search)
            qb.andWhere('o.orderNumber ILIKE :q', { q: `%${search}%` });
        const { skip, take } = (0, pagination_util_1.paginationToSkipTake)(page, limit);
        qb.skip(skip).take(take).orderBy('o.createdAt', 'DESC');
        const [data, total] = await qb.getManyAndCount();
        return (0, pagination_util_1.paginate)(data, total, page, limit);
    }
    async advanceStatus(orderId, userId, role, note) {
        const order = await this.findById(orderId);
        const next = STATUS_FLOW[order.status];
        if (!next)
            throw new common_1.BadRequestException(`Order is already ${order.status}`);
        if (role !== 'admin') {
            const sellerItem = order.items?.find(i => i.sellerId === userId);
            if (!sellerItem)
                throw new common_1.ForbiddenException('You have no items in this order');
        }
        const history = [
            ...(order.statusHistory || []),
            { status: next, timestamp: new Date().toISOString(), note, updatedBy: userId },
        ];
        const updates = { status: next, statusHistory: history };
        if (next === order_entity_1.OrderStatus.DELIVERED)
            updates.deliveredAt = new Date();
        await this.repo.update(orderId, updates);
        const buyer = await this.repo.findOne({ where: { id: orderId }, relations: ['buyer'] });
        if (buyer?.buyer) {
            await this.notif.sendOrderStatusUpdate(buyer.buyer, {
                id: orderId, orderNumber: order.orderNumber,
            }, next);
        }
        return this.findById(orderId);
    }
    async cancelOrder(orderId, userId, role, reason) {
        const order = await this.findById(orderId);
        if (order.buyerId !== userId && role !== 'admin')
            throw new common_1.ForbiddenException('Access denied');
        if ([order_entity_1.OrderStatus.DELIVERED, order_entity_1.OrderStatus.CANCELLED, order_entity_1.OrderStatus.REFUNDED].includes(order.status)) {
            throw new common_1.BadRequestException(`Cannot cancel order in status: ${order.status}`);
        }
        await this.repo.update(orderId, {
            status: order_entity_1.OrderStatus.CANCELLED,
            cancelReason: reason,
            cancelledAt: new Date(),
            statusHistory: [
                ...(order.statusHistory || []),
                { status: order_entity_1.OrderStatus.CANCELLED, timestamp: new Date().toISOString(), note: reason },
            ],
        });
        for (const item of order.items || []) {
            await this.products.decrementStock(item.productId, -item.quantity);
        }
        return this.findById(orderId);
    }
    async markPaid(orderId, reference, gateway) {
        const order = await this.findById(orderId);
        await this.repo.update(orderId, {
            paymentStatus: order_entity_1.PaymentStatus.PAID,
            paymentReference: reference,
            paymentGateway: gateway,
            status: order_entity_1.OrderStatus.CONFIRMED,
            statusHistory: [
                ...(order.statusHistory || []),
                { status: order_entity_1.OrderStatus.CONFIRMED, timestamp: new Date().toISOString(), note: 'Payment confirmed' },
            ],
        });
        return this.findById(orderId);
    }
    async getOrderStats() {
        const statuses = Object.values(order_entity_1.OrderStatus);
        const counts = await Promise.all(statuses.map(s => this.repo.count({ where: { status: s } }).then(c => ({ [s]: c }))));
        const total = await this.repo.count();
        const revenue = await this.repo
            .createQueryBuilder('o')
            .where('o.paymentStatus = :ps', { ps: order_entity_1.PaymentStatus.PAID })
            .select('SUM(o.total)', 'total')
            .getRawOne();
        return { total, revenue: Number(revenue?.total || 0), byStatus: Object.assign({}, ...counts) };
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = OrdersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(order_entity_1.OrderItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        cart_service_1.CartService,
        products_service_1.ProductsService,
        notifications_service_1.NotificationsService,
        redis_service_1.RedisService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map