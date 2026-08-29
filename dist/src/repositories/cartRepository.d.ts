import type { CartRow, CartItemRow } from '../types/cart';
export declare function findCartByUserId(userId: number): Promise<CartRow | null>;
export declare function createCart(userId: number): Promise<number>;
export declare function findCartItemById(itemId: number): Promise<(CartItemRow & {
    cart_id: number;
}) | null>;
export declare function findCartItemByCartAndProduct(cartId: number, productId: number): Promise<CartItemRow | null>;
export declare function findCartItemByCartProductVariationAndSelections(cartId: number, productId: number, variationId: number | null, selectionsJson: string): Promise<CartItemRow | null>;
export declare function findCartItemsByCartId(cartId: number): Promise<CartItemRow[]>;
export interface CartItemWithProduct {
    id: number;
    cart_id: number;
    product_id: number;
    variation_id: number | null;
    quantity: number;
    selections: Record<string, unknown> | null;
    product_name: string;
    product_slug: string;
    product_type: string;
    product_quantity: number | null;
    category_id: number | null;
    base_price: number;
}
export declare function findCartItemsWithProducts(cartId: number): Promise<CartItemWithProduct[]>;
export declare function createCartItem(cartId: number, productId: number, variationId: number | null, quantity: number, selections: Record<string, string>): Promise<number>;
export declare function updateCartItemQuantity(cartId: number, itemId: number, quantity: number): Promise<boolean>;
export declare function updateCartItem(cartId: number, itemId: number, updates: {
    quantity?: number;
    variation_id?: number | null;
    selections?: Record<string, string> | null;
}): Promise<boolean>;
export declare function deleteCartItem(cartId: number, itemId: number): Promise<boolean>;
export declare function deleteCartItemsByCartId(cartId: number): Promise<void>;
//# sourceMappingURL=cartRepository.d.ts.map