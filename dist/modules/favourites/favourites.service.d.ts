import { Repository } from 'typeorm';
import { Favourite } from './favourite.entity';
export declare class FavouritesService {
    private readonly repo;
    constructor(repo: Repository<Favourite>);
    toggle(userId: string, productId: string): Promise<{
        added: boolean;
        message: string;
    }>;
    getUserFavourites(userId: string, page: number, limit: number): Promise<import("../../common/utils/pagination.util").PaginatedResult<Favourite>>;
    isFavourited(userId: string, productId: string): Promise<boolean>;
    getUserFavouriteIds(userId: string): Promise<string[]>;
    clearAll(userId: string): Promise<void>;
}
