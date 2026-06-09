export interface ProductVariationRow {
    id: number;
    product_id: number;
    sku: string | null;
    quantity: number | null;
    price: number;
    compare_at_price: number | null;
    enabled: number;
    sort_order: number;
    combination: Record<string, string>;
    combination_signature: string;
}
export interface VariationReplaceInput {
    combination: Record<string, string>;
    sku: string | null;
    quantity: number | null;
    price: number;
    compare_at_price: number | null;
    enabled: boolean;
    sort_order: number;
}
export declare function findVariationsByProductId(productId: number): Promise<ProductVariationRow[]>;
export declare function findVariationById(id: number): Promise<ProductVariationRow | null>;
export declare function countEnabledVariations(productId: number): Promise<number>;
export declare function setVariationQuantityAbsolute(variationId: number, quantity: number): Promise<void>;
export declare function adjustVariationQuantity(_conn: unknown, variationId: number, delta: number): Promise<void>;
export declare function deleteAllForProduct(_conn: unknown, productId: number): Promise<void>;
export declare function replaceVariationsForProduct(conn: unknown, productId: number, inputs: VariationReplaceInput[]): Promise<void>;
export declare function insertGeneratedCombinations(_conn: unknown, productId: number, combos: Record<string, string>[], defaultPrice: number): Promise<number>;
//# sourceMappingURL=productVariationRepository.d.ts.map