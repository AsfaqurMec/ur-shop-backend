import type { CartPublic } from '../types/cart';
/** Re-validate a cart line at checkout (stock may have changed). */
export declare function assertLineQuantityAllowed(productId: number, quantity: number, variationId: number | null): Promise<void>;
export declare function getCart(userId: number): Promise<CartPublic>;
export declare function addItem(userId: number, productId: number, quantity: number, rawSelections?: unknown, variationId?: number | null): Promise<CartPublic>;
export declare function updateItem(userId: number, itemId: number, quantity: number): Promise<CartPublic>;
export declare function removeItem(userId: number, itemId: number): Promise<CartPublic>;
export declare function clearCart(userId: number): Promise<CartPublic>;
//# sourceMappingURL=cartService.d.ts.map