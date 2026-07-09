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
exports.FavouritesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const favourite_entity_1 = require("./favourite.entity");
const pagination_util_1 = require("../../common/utils/pagination.util");
let FavouritesService = class FavouritesService {
    constructor(repo) {
        this.repo = repo;
    }
    async toggle(userId, productId) {
        const existing = await this.repo.findOne({ where: { userId, productId } });
        if (existing) {
            await this.repo.delete(existing.id);
            return { added: false, message: 'Removed from favourites' };
        }
        await this.repo.save(this.repo.create({ userId, productId }));
        return { added: true, message: 'Added to favourites' };
    }
    async getUserFavourites(userId, page, limit) {
        const { skip, take } = (0, pagination_util_1.paginationToSkipTake)(page, limit);
        const [data, total] = await this.repo.findAndCount({
            where: { userId },
            relations: ['product', 'product.category'],
            order: { createdAt: 'DESC' },
            skip, take,
        });
        return (0, pagination_util_1.paginate)(data, total, page, limit);
    }
    async isFavourited(userId, productId) {
        const f = await this.repo.findOne({ where: { userId, productId } });
        return !!f;
    }
    async getUserFavouriteIds(userId) {
        const favs = await this.repo.find({ where: { userId }, select: ['productId'] });
        return favs.map(f => f.productId);
    }
    async clearAll(userId) {
        await this.repo.delete({ userId });
    }
};
exports.FavouritesService = FavouritesService;
exports.FavouritesService = FavouritesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(favourite_entity_1.Favourite)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], FavouritesService);
//# sourceMappingURL=favourites.service.js.map