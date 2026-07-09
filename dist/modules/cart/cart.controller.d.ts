import { CartService } from './cart.service';
export declare class CartController {
    private readonly svc;
    constructor(svc: CartService);
    getCart(uid: string): Promise<import("./cart.service").CartSummary>;
    addItem(uid: string, body: {
        productId: string;
        quantity?: number;
    }): Promise<import("./cart.service").CartSummary>;
    updateQty(uid: string, id: string, qty: number): Promise<import("./cart.service").CartSummary>;
    removeItem(uid: string, id: string): Promise<import("./cart.service").CartSummary>;
    clearCart(uid: string): Promise<void>;
    mergeCart(uid: string, sessionId: string): Promise<void>;
}
