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
var ProductsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = exports.LISTING_LIMITS = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("./product.entity");
const category_entity_1 = require("../categories/category.entity");
const user_entity_1 = require("../users/user.entity");
const cart_entity_1 = require("../cart/cart.entity");
const order_entity_1 = require("../orders/order.entity");
const redis_service_1 = require("../redis/redis.service");
const uploads_service_1 = require("../uploads/uploads.service");
const pagination_util_1 = require("../../common/utils/pagination.util");
exports.LISTING_LIMITS = {
    free: 5,
    basic: 20,
    pro: 50,
    pro_engineer: 50,
    enterprise: Infinity,
};
let ProductsService = ProductsService_1 = class ProductsService {
    constructor(repo, catRepo, cartItemRepo, orderItemRepo, redis, uploads) {
        this.repo = repo;
        this.catRepo = catRepo;
        this.cartItemRepo = cartItemRepo;
        this.orderItemRepo = orderItemRepo;
        this.redis = redis;
        this.uploads = uploads;
        this.logger = new common_1.Logger(ProductsService_1.name);
    }
    async create(dto, seller) {
        if (seller.role !== user_entity_1.UserRole.SELLER && !seller.isSeller && seller.role !== user_entity_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only sellers can list products');
        }
        if (!seller.sellerProfileComplete && seller.role !== user_entity_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Please complete your seller/company profile before listing products');
        }
        if (seller.role !== user_entity_1.UserRole.ADMIN) {
            const now = new Date();
            const status = seller.subscriptionStatus;
            if (status === 'past_due') {
                throw new common_1.ForbiddenException('Your subscription payment is overdue. Please update your billing to continue listing products.');
            }
            if (status === 'canceled') {
                throw new common_1.ForbiddenException('Your subscription has been cancelled. Please resubscribe to list products.');
            }
            if (status === 'trialing' && seller.trialEndsAt && new Date(seller.trialEndsAt) < now) {
                throw new common_1.ForbiddenException('Your free trial has expired. Please subscribe to continue listing products.');
            }
            const tier = seller.subscriptionTier || 'free';
            const limit = exports.LISTING_LIMITS[tier] ?? exports.LISTING_LIMITS.free;
            if (isFinite(limit)) {
                const count = await this.repo
                    .createQueryBuilder('p')
                    .where('p.sellerId = :sid', { sid: seller.id })
                    .andWhere('p.status != :del', { del: product_entity_1.ProductStatus.DELETED })
                    .getCount();
                if (count >= limit) {
                    throw new common_1.ForbiddenException(`Your ${tier} plan allows up to ${limit} listing${limit === 1 ? '' : 's'}. ` +
                        `You have ${count}. Please upgrade to add more products.`);
                }
            }
        }
        const { categorySlug, ...rest } = dto;
        if (categorySlug && !rest.categoryId) {
            const cat = await this.catRepo.findOne({ where: { slug: categorySlug } });
            if (cat)
                rest.categoryId = cat.id;
        }
        const baseSlug = (0, pagination_util_1.slugify)(rest.name);
        let slug = baseSlug;
        let i = 1;
        while (await this.repo.findOne({ where: { slug } })) {
            slug = `${baseSlug}-${i++}`;
        }
        const initialStatus = seller.sellerVerified ? product_entity_1.ProductStatus.ACTIVE : product_entity_1.ProductStatus.PENDING;
        const product = this.repo.create({
            ...rest,
            slug,
            sellerId: seller.id,
            sellerCity: seller.storeCity,
            sellerState: seller.storeState,
            status: initialStatus,
            images: rest.images || [],
            paymentTerms: rest.paymentTerms || ['escrow'],
        });
        const saved = await this.repo.save(product);
        await this.invalidateProductCache();
        return saved;
    }
    async update(id, dto, userId, role) {
        const product = await this.findById(id);
        if (product.sellerId !== userId && role !== user_entity_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Not your product');
        }
        const forbidden = ['id', 'sellerId', 'slug', 'views', 'salesCount', 'averageRating', 'reviewCount'];
        forbidden.forEach(k => delete dto[k]);
        Object.assign(product, dto);
        const saved = await this.repo.save(product);
        await this.redis.del(`product:${id}`);
        return saved;
    }
    async delete(id, userId, role) {
        const product = await this.findById(id);
        if (product.sellerId !== userId && role !== user_entity_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Not your product');
        }
        await this.repo.update(id, { status: product_entity_1.ProductStatus.DELETED });
        await this.redis.del(`product:${id}`);
        await this.invalidateProductCache();
    }
    async findById(id, incrementView = false) {
        const cacheKey = `product:${id}`;
        let product = await this.redis.get(cacheKey);
        if (!product) {
            product = await this.repo.findOne({
                where: { id },
                relations: ['category', 'seller'],
            });
            if (!product)
                throw new common_1.NotFoundException('Product not found');
            await this.redis.set(cacheKey, product, 300);
        }
        if (incrementView) {
            await this.repo.increment({ id }, 'views', 1);
            product.views = (product.views || 0) + 1;
        }
        return product;
    }
    async findBySlug(slug) {
        const product = await this.repo.findOne({
            where: { slug },
            relations: ['category', 'seller'],
        });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        await this.repo.increment({ id: product.id }, 'views', 1);
        return product;
    }
    async search(filters, page, limit) {
        const qb = this.repo.createQueryBuilder('p')
            .leftJoinAndSelect('p.category', 'cat')
            .leftJoinAndSelect('p.seller', 'sel')
            .where('p.status = :status', { status: product_entity_1.ProductStatus.ACTIVE });
        if (filters.category)
            qb.andWhere('cat.slug = :cat', { cat: filters.category });
        if (filters.sellerId)
            qb.andWhere('p.sellerId = :sellerId', { sellerId: filters.sellerId });
        if (filters.minPrice)
            qb.andWhere('p.price >= :min', { min: filters.minPrice });
        if (filters.maxPrice)
            qb.andWhere('p.price <= :max', { max: filters.maxPrice });
        if (filters.condition)
            qb.andWhere('p.condition = :cond', { cond: filters.condition });
        if (filters.city)
            qb.andWhere('p.sellerCity ILIKE :city', { city: `%${filters.city}%` });
        if (filters.state)
            qb.andWhere('p.sellerState ILIKE :state', { state: `%${filters.state}%` });
        if (filters.featured)
            qb.andWhere('p.featured = true');
        if (filters.search) {
            qb.andWhere('(p.name ILIKE :q OR p.brand ILIKE :q OR p.description ILIKE :q)', { q: `%${filters.search}%` });
        }
        const { skip, take } = (0, pagination_util_1.paginationToSkipTake)(page, limit);
        qb.skip(skip).take(take).orderBy('p.featured', 'DESC').addOrderBy('p.createdAt', 'DESC');
        const [data, total] = await qb.getManyAndCount();
        return (0, pagination_util_1.paginate)(data, total, page, limit);
    }
    async getFeatured(limit = 12) {
        return this.redis.cacheOrFetch('products:featured', () => this.repo.find({
            where: { status: product_entity_1.ProductStatus.ACTIVE, featured: true },
            relations: ['category'],
            take: limit,
            order: { createdAt: 'DESC' },
        }), 600);
    }
    async getByCategory(categorySlug, page, limit) {
        return this.search({ category: categorySlug }, page, limit);
    }
    async getSellerProducts(sellerId, page, limit) {
        const { skip, take } = (0, pagination_util_1.paginationToSkipTake)(page, limit);
        const [data, total] = await this.repo.findAndCount({
            where: { sellerId },
            relations: ['category'],
            skip, take,
            order: { createdAt: 'DESC' },
        });
        return (0, pagination_util_1.paginate)(data, total, page, limit);
    }
    async getListingQuota(seller) {
        const tier = seller.subscriptionTier || 'free';
        const limit = exports.LISTING_LIMITS[tier] ?? exports.LISTING_LIMITS.free;
        const used = await this.repo
            .createQueryBuilder('p')
            .where('p.sellerId = :sid', { sid: seller.id })
            .andWhere('p.status != :del', { del: product_entity_1.ProductStatus.DELETED })
            .getCount();
        return {
            tier,
            used,
            limit: isFinite(limit) ? limit : null,
            remaining: isFinite(limit) ? Math.max(0, limit - used) : null,
            canPost: isFinite(limit) ? used < limit : true,
        };
    }
    async getStats() {
        const [total, active, pending] = await Promise.all([
            this.repo.count(),
            this.repo.count({ where: { status: product_entity_1.ProductStatus.ACTIVE } }),
            this.repo.count({ where: { status: product_entity_1.ProductStatus.PENDING } }),
        ]);
        return { total, active, pending };
    }
    async updateRating(productId, avg, count) {
        await this.repo.update(productId, { averageRating: avg, reviewCount: count });
        await this.redis.del(`product:${productId}`);
    }
    async decrementStock(productId, qty) {
        await this.repo.decrement({ id: productId }, 'stock', qty);
        await this.redis.del(`product:${productId}`);
    }
    async incrementSales(productId, qty) {
        await this.repo.increment({ id: productId }, 'salesCount', qty);
    }
    async approve(id) {
        await this.repo.update(id, { status: product_entity_1.ProductStatus.ACTIVE });
        await this.redis.del(`product:${id}`);
        return this.findById(id);
    }
    async getEditLockStatus(productId) {
        const inActiveOrder = await this.orderItemRepo
            .createQueryBuilder('oi')
            .innerJoin('oi.order', 'o')
            .where('oi.productId = :pid', { pid: productId })
            .andWhere('o.status NOT IN (:...finalStatuses)', {
            finalStatuses: ['cancelled', 'refunded', 'delivered'],
        })
            .getCount();
        if (inActiveOrder > 0) {
            return { locked: true, reason: 'This product is part of an active order and cannot be edited until the order is completed.' };
        }
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const inCartToday = await this.cartItemRepo
            .createQueryBuilder('ci')
            .where('ci.productId = :pid', { pid: productId })
            .andWhere('ci.createdAt BETWEEN :start AND :end', { start: todayStart, end: todayEnd })
            .getCount();
        if (inCartToday > 0) {
            return { locked: true, reason: 'A customer added this product to their cart today. You can edit it tomorrow.' };
        }
        return { locked: false };
    }
    async invalidateProductCache() {
        await this.redis.delByPattern('products:*');
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = ProductsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __param(2, (0, typeorm_1.InjectRepository)(cart_entity_1.CartItem)),
    __param(3, (0, typeorm_1.InjectRepository)(order_entity_1.OrderItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        redis_service_1.RedisService,
        uploads_service_1.UploadsService])
], ProductsService);
//# sourceMappingURL=products.service.js.map