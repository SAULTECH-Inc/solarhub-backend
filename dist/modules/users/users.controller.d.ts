import { UsersService } from './users.service';
import { UserStatus } from './user.entity';
export declare class UsersController {
    private readonly svc;
    constructor(svc: UsersService);
    getProfile(uid: string): Promise<import("./user.entity").User>;
    updateProfile(uid: string, dto: any): Promise<import("./user.entity").User>;
    getAddresses(uid: string): Promise<{
        id: string;
        label: string;
        firstName: string;
        lastName: string;
        phone: string;
        address: string;
        city: string;
        state: string;
        country: string;
        isDefault: boolean;
    }[]>;
    addAddress(uid: string, dto: any): Promise<import("./user.entity").User>;
    updateAddress(uid: string, aid: string, dto: any): Promise<import("./user.entity").User>;
    deleteAddress(uid: string, aid: string): Promise<import("./user.entity").User>;
    becomeSeller(uid: string, dto: any): Promise<import("./user.entity").User>;
    updateSellerProfile(uid: string, dto: any): Promise<import("./user.entity").User>;
    getPublicProfile(id: string): Promise<import("./user.entity").User>;
    listAll(page?: number, limit?: number, role?: string, status?: string, search?: string): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("./user.entity").User>>;
    updateStatus(id: string, status: UserStatus): Promise<import("./user.entity").User>;
}
