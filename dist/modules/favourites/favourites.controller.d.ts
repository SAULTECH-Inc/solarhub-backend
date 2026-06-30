import { FavouritesService } from './favourites.service';
export declare class FavouritesController {
    private readonly svc;
    constructor(svc: FavouritesService);
    getAll(uid: string, p?: number, l?: number): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("./favourite.entity").Favourite>>;
    getIds(uid: string): Promise<string[]>;
    toggle(uid: string, pid: string): Promise<{
        added: boolean;
        message: string;
    }>;
    check(uid: string, pid: string): Promise<{
        isFavourited: boolean;
    }>;
    clearAll(uid: string): Promise<void>;
}
