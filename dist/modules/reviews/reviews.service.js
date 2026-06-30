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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const review_entity_1 = require("./review.entity");
const products_service_1 = require("../products/products.service");
const pagination_util_1 = require("../../common/utils/pagination.util");
let ReviewsService = class ReviewsService {
    constructor(repo, products) {
        this.repo = repo;
        this.products = products;
    }
    async create(userId, dto) {
        if (dto.rating < 1 || dto.rating > 5)
            throw new common_1.BadRequestException('Rating must be 1–5');
        const existing = await this.repo.findOne({ where: { userId, productId: dto.productId } });
        if (existing)
            throw new common_1.BadRequestException('You have already reviewed this product');
        const review = await this.repo.save(this.repo.create({ ...dto, userId, verified: !!dto.orderId }));
        await this.recalculateProductRating(dto.productId);
        return review;
    }
    async getProductReviews(productId, page, limit) {
        const { skip, take } = (0, pagination_util_1.paginationToSkipTake)(page, limit);
        const [data, total] = await this.repo.findAndCount({
            where: { productId },
            relations: ['user'],
            order: { createdAt: 'DESC' },
            skip, take,
        });
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
        return { ...(0, pagination_util_1.paginate)(data, total, page, limit), avg: Number(avg.toFixed(2)), breakdown };
    }
    async replyToReview(reviewId, sellerId, reply) {
        const review = await this.repo.findOne({ where: { id: reviewId } });
        if (!review)
            throw new common_1.NotFoundException('Review not found');
        const product = await this.products.findById(review.productId);
        if (product.sellerId !== sellerId)
            throw new common_1.ForbiddenException('Not your product');
        await this.repo.update(reviewId, { sellerReply: reply, sellerRepliedAt: new Date() });
        return this.repo.findOne({ where: { id: reviewId } });
    }
    async markHelpful(reviewId) {
        await this.repo.increment({ id: reviewId }, 'helpfulCount', 1);
    }
    async delete(reviewId, userId, role) {
        const review = await this.repo.findOne({ where: { id: reviewId } });
        if (!review)
            throw new common_1.NotFoundException('Review not found');
        if (review.userId !== userId && role !== 'admin')
            throw new common_1.ForbiddenException('Not your review');
        const { productId } = review;
        await this.repo.delete(reviewId);
        await this.recalculateProductRating(productId);
    }
    async recalculateProductRating(productId) {
        const result = await this.repo
            .createQueryBuilder('r')
            .where('r.productId = :pid', { pid: productId })
            .select('AVG(r.rating)', 'avg')
            .addSelect('COUNT(*)', 'count')
            .getRawOne();
        await this.products.updateRating(productId, Number(Number(result?.avg || 0).toFixed(2)), Number(result?.count || 0));
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(review_entity_1.Review)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        products_service_1.ProductsService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map