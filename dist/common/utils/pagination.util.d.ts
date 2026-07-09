export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export declare function paginate<T>(data: T[], total: number, page: number, limit: number): PaginatedResult<T>;
export declare function paginationToSkipTake(page: number, limit: number): {
    skip: number;
    take: number;
};
export declare function generateOtp(): string;
export declare function slugify(text: string): string;
export declare function formatCurrency(amount: number, currency: string): string;
export declare function toSubunit(amount: number, currency: string): number;
export declare function generateOrderId(): string;
export declare function generateTrackingCode(): string;
