import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductStatus } from './product.entity';
import { Category } from '../categories/category.entity';
import { User, UserRole } from '../users/user.entity';
import { CartItem } from '../cart/cart.entity';
import { OrderItem } from '../orders/order.entity';
import { RedisService } from '../redis/redis.service';
import { UploadsService } from '../uploads/uploads.service';
import { paginate, paginationToSkipTake, slugify } from '../../common/utils/pagination.util';

/** Max active/pending listings allowed per subscription tier */
export const LISTING_LIMITS: Record<string, number> = {
  free:         5,
  basic:        20,
  pro:          50,
  pro_engineer: 50,
  enterprise:   Infinity,
};

export interface ProductFilters {
  category?: string;
  sellerId?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  city?: string;
  state?: string;
  search?: string;
  featured?: boolean;
  currency?: string;
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)   private readonly repo: Repository<Product>,
    @InjectRepository(Category)  private readonly catRepo: Repository<Category>,
    @InjectRepository(CartItem)  private readonly cartItemRepo: Repository<CartItem>,
    @InjectRepository(OrderItem) private readonly orderItemRepo: Repository<OrderItem>,
    private readonly redis: RedisService,
    private readonly uploads: UploadsService,
  ) {}

  // ── Create / Update ───────────────────────────────────────
  async create(dto: Partial<Product> & { categorySlug?: string }, seller: User): Promise<Product> {
    if (seller.role !== UserRole.SELLER && !seller.isSeller && seller.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only sellers can list products');
    }
    if (!seller.sellerProfileComplete && seller.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Please complete your seller/company profile before listing products');
    }

    // ── Subscription Enforcement ──────────────────────────────
    if (seller.role !== UserRole.ADMIN) {
      const now = new Date();
      const status = seller.subscriptionStatus;

      // Blocked statuses — no listing allowed regardless of tier
      if (status === 'past_due') {
        throw new ForbiddenException('Your subscription payment is overdue. Please update your billing to continue listing products.');
      }
      if (status === 'canceled') {
        throw new ForbiddenException('Your subscription has been cancelled. Please resubscribe to list products.');
      }
      if (status === 'trialing' && seller.trialEndsAt && new Date(seller.trialEndsAt) < now) {
        throw new ForbiddenException('Your free trial has expired. Please subscribe to continue listing products.');
      }

      // Tier listing cap — count non-deleted listings
      const tier = seller.subscriptionTier || 'free';
      const limit = LISTING_LIMITS[tier] ?? LISTING_LIMITS.free;

      if (isFinite(limit)) {
        const count = await this.repo
          .createQueryBuilder('p')
          .where('p.sellerId = :sid', { sid: seller.id })
          .andWhere('p.status != :del', { del: ProductStatus.DELETED })
          .getCount();

        if (count >= limit) {
          throw new ForbiddenException(
            `Your ${tier} plan allows up to ${limit} listing${limit === 1 ? '' : 's'}. ` +
            `You have ${count}. Please upgrade to add more products.`,
          );
        }
      }
    }

    // Resolve categorySlug → categoryId
    const { categorySlug, ...rest } = dto as any;
    if (categorySlug && !rest.categoryId) {
      const cat = await this.catRepo.findOne({ where: { slug: categorySlug } });
      if (cat) rest.categoryId = cat.id;
    }

    const baseSlug = slugify(rest.name);
    let slug = baseSlug;
    let i = 1;
    while (await this.repo.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${i++}`;
    }

    // Verified sellers publish immediately; unverified go to PENDING for review
    const initialStatus = seller.sellerVerified ? ProductStatus.ACTIVE : ProductStatus.PENDING;

    const product = this.repo.create({
      ...rest,
      slug,
      sellerId: seller.id,
      sellerCity:  seller.storeCity,
      sellerState: seller.storeState,
      status: initialStatus,
      images: rest.images || [],
      paymentTerms: rest.paymentTerms || ['escrow'],
    });

    const saved = await this.repo.save(product) as unknown as Product;
    await this.invalidateProductCache();
    return saved;
  }

  async update(id: string, dto: Partial<Product>, userId: string, role: string): Promise<Product> {
    const product = await this.findById(id);
    if (product.sellerId !== userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not your product');
    }
    const forbidden = ['id','sellerId','slug','views','salesCount','averageRating','reviewCount'];
    forbidden.forEach(k => delete dto[k]);
    Object.assign(product, dto);
    const saved = await this.repo.save(product);
    await this.redis.del(`product:${id}`);
    return saved;
  }

  async delete(id: string, userId: string, role: string): Promise<void> {
    const product = await this.findById(id);
    if (product.sellerId !== userId && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Not your product');
    }
    await this.repo.update(id, { status: ProductStatus.DELETED });
    await this.redis.del(`product:${id}`);
    await this.invalidateProductCache();
  }

  // ── Find / Search ─────────────────────────────────────────
  async findById(id: string, incrementView = false): Promise<Product> {
    const cacheKey = `product:${id}`;
    let product = await this.redis.get<Product>(cacheKey);

    if (!product) {
      product = await this.repo.findOne({
        where: { id },
        relations: ['category', 'seller'],
      });
      if (!product) throw new NotFoundException('Product not found');
      await this.redis.set(cacheKey, product, 300);
    }

    if (incrementView) {
      await this.repo.increment({ id }, 'views', 1);
      product.views = (product.views || 0) + 1;
    }
    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.repo.findOne({
      where: { slug },
      relations: ['category', 'seller'],
    });
    if (!product) throw new NotFoundException('Product not found');
    await this.repo.increment({ id: product.id }, 'views', 1);
    return product;
  }

  async search(filters: ProductFilters, page: number, limit: number) {
    const qb = this.repo.createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'cat')
      .leftJoinAndSelect('p.seller', 'sel')
      .where('p.status = :status', { status: ProductStatus.ACTIVE });

    if (filters.category)   qb.andWhere('cat.slug = :cat', { cat: filters.category });

    if (filters.sellerId)   qb.andWhere('p.sellerId = :sellerId', { sellerId: filters.sellerId });
    if (filters.minPrice)   qb.andWhere('p.price >= :min', { min: filters.minPrice });
    if (filters.maxPrice)   qb.andWhere('p.price <= :max', { max: filters.maxPrice });
    if (filters.condition)  qb.andWhere('p.condition = :cond', { cond: filters.condition });
    if (filters.city)       qb.andWhere('p.sellerCity ILIKE :city', { city: `%${filters.city}%` });
    if (filters.state)      qb.andWhere('p.sellerState ILIKE :state', { state: `%${filters.state}%` });
    if (filters.featured)   qb.andWhere('p.featured = true');

    if (filters.search) {
      qb.andWhere(
        '(p.name ILIKE :q OR p.brand ILIKE :q OR p.description ILIKE :q)',
        { q: `%${filters.search}%` },
      );
    }

    const { skip, take } = paginationToSkipTake(page, limit);
    qb.skip(skip).take(take).orderBy('p.featured', 'DESC').addOrderBy('p.createdAt', 'DESC');

    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async getFeatured(limit = 12): Promise<Product[]> {
    return this.redis.cacheOrFetch(
      'products:featured',
      () => this.repo.find({
        where: { status: ProductStatus.ACTIVE, featured: true },
        relations: ['category'],
        take: limit,
        order: { createdAt: 'DESC' },
      }),
      600,
    );
  }

  async getByCategory(categorySlug: string, page: number, limit: number) {
    return this.search({ category: categorySlug }, page, limit);
  }

  async getSellerProducts(sellerId: string, page: number, limit: number) {
    const { skip, take } = paginationToSkipTake(page, limit);
    const [data, total] = await this.repo.findAndCount({
      where: { sellerId },
      relations: ['category'],
      skip, take,
      order: { createdAt: 'DESC' },
    });
    return paginate(data, total, page, limit);
  }

  // ── Seller quota ──────────────────────────────────────────
  async getListingQuota(seller: User) {
    const tier = seller.subscriptionTier || 'free';
    const limit = LISTING_LIMITS[tier] ?? LISTING_LIMITS.free;
    const used = await this.repo
      .createQueryBuilder('p')
      .where('p.sellerId = :sid', { sid: seller.id })
      .andWhere('p.status != :del', { del: ProductStatus.DELETED })
      .getCount();

    return {
      tier,
      used,
      limit: isFinite(limit) ? limit : null,   // null = unlimited
      remaining: isFinite(limit) ? Math.max(0, limit - used) : null,
      canPost: isFinite(limit) ? used < limit : true,
    };
  }

  // ── Stats / analytics ─────────────────────────────────────
  async getStats() {
    const [total, active, pending] = await Promise.all([
      this.repo.count(),
      this.repo.count({ where: { status: ProductStatus.ACTIVE } }),
      this.repo.count({ where: { status: ProductStatus.PENDING } }),
    ]);
    return { total, active, pending };
  }

  async updateRating(productId: string, avg: number, count: number): Promise<void> {
    await this.repo.update(productId, { averageRating: avg, reviewCount: count });
    await this.redis.del(`product:${productId}`);
  }

  async decrementStock(productId: string, qty: number): Promise<void> {
    await this.repo.decrement({ id: productId }, 'stock', qty);
    await this.redis.del(`product:${productId}`);
  }

  async incrementSales(productId: string, qty: number): Promise<void> {
    await this.repo.increment({ id: productId }, 'salesCount', qty);
  }

  // ── Admin approve ─────────────────────────────────────────
  async approve(id: string): Promise<Product> {
    await this.repo.update(id, { status: ProductStatus.ACTIVE });
    await this.redis.del(`product:${id}`);
    return this.findById(id);
  }

  // ── Edit lock check ───────────────────────────────────────
  async getEditLockStatus(productId: string): Promise<{ locked: boolean; reason?: string }> {
    // Locked if in an active order (not yet cancelled/refunded/delivered)
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

    // Locked if added to any cart today (same calendar day)
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

  private async invalidateProductCache(): Promise<void> {
    await this.redis.delByPattern('products:*');
  }
}
