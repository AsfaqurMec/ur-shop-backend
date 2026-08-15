import type { ProductFileRow, ProductImageRow, ProductLicensePoolRow, ProductRow, ProductType } from '../types/product';
export declare function createProduct(data: {
    category_id: number | null;
    name: string;
    slug: string;
    description: string | null;
    full_description: string | null;
    size_chart_image: string | null;
    features: string[] | null;
    product_type: ProductType;
    manual_fulfillment_required: number;
    price: number;
    compare_at_price: number | null;
    is_active: number;
    is_featured: number;
}): Promise<number>;
export declare function updateProduct(id: number, data: {
    category_id?: number | null;
    name?: string;
    slug?: string;
    description?: string | null;
    full_description?: string | null;
    size_chart_image?: string | null;
    features?: string[] | null;
    product_type?: ProductType;
    manual_fulfillment_required?: number;
    price?: number;
    compare_at_price?: number | null;
    sku?: string | null;
    quantity?: number | null;
    default_variation_id?: number | null;
    is_active?: number;
    is_featured?: number;
}): Promise<void>;
export declare function softDeleteProduct(id: number): Promise<boolean>;
export declare function findProductById(id: number): Promise<ProductRow | null>;
export declare function findProductBySlug(slug: string): Promise<ProductRow | null>;
export declare function productSlugExists(slug: string, excludeId?: number): Promise<boolean>;
export interface ProductListFilters {
    category_id?: number;
    product_type?: ProductType;
    min_price?: number;
    max_price?: number;
    on_sale?: boolean;
    search?: string;
    featured?: boolean;
    is_active?: boolean;
    sort?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
}
export declare function findProducts(filters: ProductListFilters, limit: number, offset: number): Promise<ProductRow[]>;
export declare function getNeedsPdpConfigMap(productIds: number[]): Promise<Map<number, boolean>>;
export declare function findDefaultVariationStorefrontPricing(productIds: number[]): Promise<Map<number, {
    price: number;
    compare_at_price: number | null;
}>>;
export declare function countProducts(filters: ProductListFilters): Promise<number>;
export declare function createProductImage(data: {
    product_id: number;
    path: string;
    alt_text: string | null;
    sort_order: number;
}): Promise<number>;
export declare function findProductImagesByProductId(productId: number): Promise<ProductImageRow[]>;
export declare function findPrimaryImagePathsByProductIds(productIds: number[]): Promise<Map<number, string>>;
export declare function deleteProductImage(id: number, productId: number): Promise<boolean>;
export declare function deleteAllProductImagesByProductId(productId: number): Promise<void>;
export declare function createProductFile(data: {
    product_id: number;
    file_path: string;
    file_name: string;
    file_size: number | null;
    download_limit: number | null;
    sort_order: number;
}): Promise<number>;
export declare function findProductFilesByProductId(productId: number): Promise<ProductFileRow[]>;
export declare function findProductFileById(id: number, productId: number): Promise<ProductFileRow | null>;
export declare function findProductFileByIdOnly(id: number): Promise<ProductFileRow | null>;
export declare function deleteProductFile(id: number, productId: number): Promise<boolean>;
export declare function createLicenseKeys(productId: number, keys: string[], productVariationId: number | null): Promise<number>;
export declare function countAvailableLicensesNoVariation(productId: number): Promise<number>;
export declare function countAvailableLicensesForVariation(productId: number, productVariationId: number): Promise<number>;
export declare function countSellableLicensesWithVariations(productId: number): Promise<number>;
export declare function findLicensePoolByProductId(productId: number): Promise<ProductLicensePoolRow[]>;
export declare function findLicensePoolByProductIdPaged(productId: number, limit: number, offset: number, filters?: {
    status?: 'all' | 'available' | 'used';
    product_variation_id?: number;
}): Promise<ProductLicensePoolRow[]>;
export declare function countLicensePoolByProductId(productId: number, filters?: {
    status?: 'all' | 'available' | 'used';
    product_variation_id?: number;
}): Promise<number>;
export declare function findLicenseById(productId: number, licenseId: number): Promise<ProductLicensePoolRow | null>;
export declare function updateLicenseKey(productId: number, licenseId: number, fields: {
    license_key?: string;
    product_variation_id?: number | null;
}): Promise<boolean>;
export declare function assignUnassignedLicenseKeysToVariation(productId: number, productVariationId: number): Promise<number>;
export declare function deleteLicenseKey(productId: number, licenseId: number): Promise<boolean>;
export interface AssignedLicenseForUserRow {
    id: number;
    order_id: number;
    order_number: string;
    order_item_id: number;
    product_id: number;
    product_name: string;
    license_key: string;
    used_at: Date;
}
export interface LicenseKeyForOrderRow {
    order_item_id: number;
    product_name: string;
    license_key: string;
}
export declare function findLicensesByOrderId(orderId: number): Promise<LicenseKeyForOrderRow[]>;
export declare function findAssignedLicensesForUser(userId: number): Promise<AssignedLicenseForUserRow[]>;
export declare function assignLicenseKeysToOrderItem(_conn: unknown, productId: number, orderItemId: number, quantity: number, productVariationId: number | null): Promise<number>;
//# sourceMappingURL=productRepository.d.ts.map