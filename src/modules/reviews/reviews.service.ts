import {
  Injectable, BadRequestException, NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { ProductsService } from '../products/products.service';
import { paginate, paginationToSkipTake } from '../../common/utils/pagination.util';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private readonly repo: Repository<Review>,
    private readonly products: ProductsService,
  ) {}

  async create(
    userId: string,
    dto: {
      productId: string; rating: number; title?: string;
      body?: string; images?: string[]; orderId?: string; orderItemId?: string;
    },
  ): Promise<Review> {
    if (dto.rating < 1 || dto.rating > 5) throw new BadRequestException('Rating must be 1–5');

    const existing = await this.repo.findOne({ where: { userId, productId: dto.productId } });
    if (existing) throw new BadRequestException('You have already reviewed this product');

    const review = await this.repo.save(
      this.repo.create({ ...dto, userId, verified: !!dto.orderId }),
    );
    await this.recalculateProductRating(dto.productId);
    return review;
  }

  async getProductReviews(productId: string, page: number, limit: number) {
    const { skip, take } = paginationToSkipTake(page, limit);
    const [data, total] = await this.repo.findAndCount({
      where: { productId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip, take,
    });

    // Rating breakdown
    const breakdown = await this.repo
      .createQueryBuilder('r')
      .where('r.productId = :pid', { pid: productId })
      .select('r.rating', 'rating')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.rating')
      .getRawMany();

    const avg = data.length
      ? data.reduce((s, r) => s + r.rating, 0) / data.length
      : 0;

    return { ...paginate(data, total, page, limit), avg: Number(avg.toFixed(2)), breakdown };
  }

  async replyToReview(reviewId: string, sellerId: string, reply: string): Promise<Review> {
    const review = await this.repo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    const product = await this.products.findById(review.productId);
    if (product.sellerId !== sellerId) throw new ForbiddenException('Not your product');

    await this.repo.update(reviewId, { sellerReply: reply, sellerRepliedAt: new Date() });
    return this.repo.findOne({ where: { id: reviewId } });
  }

  async markHelpful(reviewId: string): Promise<void> {
    await this.repo.increment({ id: reviewId }, 'helpfulCount', 1);
  }

  async delete(reviewId: string, userId: string, role: string): Promise<void> {
    const review = await this.repo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId && role !== 'admin') throw new ForbiddenException('Not your review');
    const { productId } = review;
    await this.repo.delete(reviewId);
    await this.recalculateProductRating(productId);
  }

  private async recalculateProductRating(productId: string): Promise<void> {
    const result = await this.repo
      .createQueryBuilder('r')
      .where('r.productId = :pid', { pid: productId })
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .getRawOne();

    await this.products.updateRating(
      productId,
      Number(Number(result?.avg || 0).toFixed(2)),
      Number(result?.count || 0),
    );
  }
}
