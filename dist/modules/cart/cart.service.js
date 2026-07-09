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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cart_entity_1 = require("./cart.entity");
const products_service_1 = require("../products/products.service");
const redis_service_1 = require("../redis/redis.service");
let CartService = class CartService {
    constructor(repo, products, redis) {
        this.repo = repo;
        this.products = products;
        this.redis = redis;
    }
    async addItem(userId, productId, quantity = 1) {
        const product = await this.products.findById(productId);
        if (product.stock < quantity) {
            throw new common_1.BadRequestException(`Only ${product.stock} units available`);
        }
        const existing = await this.repo.findOne({ where: { userId, productId } });
        if (existing) {
            const newQty = existing.quantity + quantity;
            if (product.stock < newQty)
                throw new common_1.BadRequestException('Not enough stock');
            await this.repo.update(existing.id, { quantity: newQty });
        }
        else {
            await this.repo.save(this.repo.create({ userId, productId, quantity, priceAtAdd: product.price }));
        }
        await this.redis.del(`cart:${userId}`);
        return this.getCart(userId);
    }
    async updateQty(userId, itemId, quantity) {
        const item = await this.repo.findOne({ where: { id: itemId, userId }, relations: ['product'] });
        if (!item)
            throw new common_1.NotFoundException('Cart item not found');
        if (quantity < 1) {
            await this.repo.delete(itemId);
        }
        else {
            if (item.product.stock < quantity)
                throw new common_1.BadRequestException('Not enough stock');
            await this.repo.update(itemId, { quantity });
        }
        await this.redis.del(`cart:${userId}`);
        return this.getCart(userId);
    }
    async removeItem(userId, itemId) {
        await this.repo.delete({ id: itemId, userId });
        await this.redis.del(`cart:${userId}`);
        return this.getCart(userId);
    }
    async clearCart(userId) {
        await this.repo.delete({ userId });
        await this.redis.del(`cart:${userId}`);
    }
    async getCart(userId) {
        const items = await this.repo.find({
            where: { userId },
            relations: ['product', 'product.category'],
            order: { createdAt: 'ASC' },
        });
        const subtotal = items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
        const itemCount = items.reduce((s, i) => s + i.quantity, 0);
        return { items, itemCount, subtotal, currency: 'NGN' };
    }
    async mergeGuestCart(userId, sessionId) {
        const guestItems = await this.repo.find({ where: { sessionId } });
        for (const gi of guestItems) {
            const existing = await this.repo.findOne({ where: { userId, productId: gi.productId } });
            if (existing) {
                await this.repo.update(existing.id, { quantity: existing.quantity + gi.quantity });
                await this.repo.delete(gi.id);
            }
            else {
                await this.repo.update(gi.id, { userId, sessionId: null });
            }
        }
        await this.redis.del(`cart:${userId}`);
    }
    async getItemsForOrder(userId) {
        return this.repo.find({
            where: { userId },
            relations: ['product'],
        });
    }
};
exports.CartService = CartService;
exports.CartService = CartService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cart_entity_1.CartItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        products_service_1.ProductsService,
        redis_service_1.RedisService])
], CartService);
//# sourceMappingURL=cart.service.js.map