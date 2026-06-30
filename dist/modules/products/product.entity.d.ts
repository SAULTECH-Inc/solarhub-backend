import { User } from '../users/user.entity';
import { Category } from '../categories/category.entity';
export declare enum ProductStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    PENDING = "pending",
    SOLD_OUT = "sold_out",
    DELETED = "deleted"
}
export declare enum ProductCondition {
    NEW = "new",
    USED_LIKE_NEW = "used_like_new",
    USED_GOOD = "used_good",
    REFURBISHED = "refurbished"
}
export declare enum DeliveryPayer {
    SELLER = "seller",
    BUYER = "buyer",
    SHARED = "shared",
    NEGOTIABLE = "negotiable"
}
export declare enum PaymentTerm {
    ESCROW = "escrow",
    BEFORE_DELIVERY = "before_delivery",
    ON_DELIVERY = "on_delivery",
    AFTER_INSPECTION = "after_inspection",
    INSTALLMENT = "installment"
}
export declare class Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    currency: string;
    prices: {
        NGN?: number;
        USD?: number;
        CNY?: number;
        GHS?: number;
    };
    stock: number;
    condition: ProductCondition;
    status: ProductStatus;
    brand: string;
    modelNumber: string;
    warrantyYears: number;
    sellerCity: string;
    sellerState: string;
    deliveryDays: number;
    shippingPayer: DeliveryPayer;
    serviceAreas: string;
    paymentTerms: string[];
    returnPolicy: string;
    images: string[];
    thumbnail: string;
    specs: Record<string, any>;
    discounts: Array<{
        type: 'percentage' | 'fixed' | 'free_unit';
        minQty: number;
        value: number;
    }>;
    views: number;
    salesCount: number;
    averageRating: number;
    reviewCount: number;
    featured: boolean;
    badge: string;
    searchVector: any;
    categoryId: string;
    sellerId: string;
    category: Category;
    seller: User;
    createdAt: Date;
    updatedAt: Date;
}
