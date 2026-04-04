// favourites.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favourite } from './favourite.entity';
import { paginate, paginationToSkipTake } from '../../common/utils/pagination.util';

@Injectable()
export class FavouritesService {
  constructor(@InjectRepository(Favourite) private readonly repo: Repository<Favourite>) {}

  async toggle(userId: string, productId: string): Promise<{ added: boolean; message: string }> {
    const existing = await this.repo.findOne({ where: { userId, productId } });
    if (existing) {
      await this.repo.delete(existing.id);
      return { added: false, message: 'Removed from favourites' };
    }
    await this.repo.save(this.repo.create({ userId, productId }));
    return { added: true, message: 'Added to favourites' };
  }

  async getUserFavourites(userId: string, page: number, limit: number) {
    const { skip, take } = paginationToSkipTake(page, limit);
    const [data, total] = await this.repo.findAndCount({
      where: { userId },
      relations: ['product', 'product.category'],
      order: { createdAt: 'DESC' },
      skip, take,
    });
    return paginate(data, total, page, limit);
  }

  async isFavourited(userId: string, productId: string): Promise<boolean> {
    const f = await this.repo.findOne({ where: { userId, productId } });
    return !!f;
  }

  async getUserFavouriteIds(userId: string): Promise<string[]> {
    const favs = await this.repo.find({ where: { userId }, select: ['productId'] });
    return favs.map(f => f.productId);
  }

  async clearAll(userId: string): Promise<void> {
    await this.repo.delete({ userId });
  }
}
