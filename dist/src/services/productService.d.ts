import type { ProductPublic, ProductImagePublic, ProductFilePublic, ProductListQuery, ProductListResult, ProductType } from '../types/product';
import * as purchaseVariableRepo from '../repositories/productPurchaseVariableRepository';
/** Mirror each variation's `quantity` to unused license rows for that variation (license_key + variations). */
export declare function syncLicenseVariationQuantitiesForProduct(productId: number): Promise<void>;
export declare function create(data: {
    name: string;
    slug?: string;
    description?: string | null;
    full_description?: string | null;
    features?: string[] | null;
    category_id?: number | null;
    product_type: ProductType;
    manual_fulfillment_required?: boolean;
    price: number;
    compare_at_price?: number | null;
    is_active?: boolean;
    is_featured?: boolean;
}): Promise<ProductPublic>;
export declare function update(id: number, data: {
    name?: string;
    slug?: string;
    description?: string | null;
    full_description?: string | null;
    size_chart_image?: string | null;
    features?: string[] | null;
    category_id?: number | null;
    product_type?: ProductType;
    manual_fulfillment_required?: boolean;
    price?: number;
    compare_at_price?: number | null;
    sku?: string | null;
    quantity?: number | null;
    default_variation_id?: number | null;
    is_active?: boolean;
    is_featured?: boolean;
}): Promise<ProductPublic>;
/** Stores a single optional size-chart image path alongside the product. */
export declare function setSizeChartImage(id: number, path: string | null): Promise<ProductPublic>;
export declare function remove(id: number): Promise<void>;
export declare function list(query: ProductListQuery): Promise<ProductListResult>;
export declare function getBySlug(slug: string, forPublic?: boolean): Promise<ProductPublic>;
export declare function getById(id: number): Promise<ProductPublic>;
export declare function replacePurchaseVariables(productId: number, variables: purchaseVariableRepo.AdminVariableInput[]): Promise<ProductPublic>;
export declare function addImage(productId: number, filenameOrUrl: string, altText?: string | null, sortOrder?: number): Promise<ProductImagePublic>;
export declare function removeImage(productId: number, imageId: number): Promise<void>;
export declare function addFile(productId: number, filename: string, displayName: string, fileSize: number | null, downloadLimit?: number | null, sortOrder?: number): Promise<ProductFilePublic>;
export declare function removeFile(productId: number, fileId: number): Promise<void>;
export declare function addLicenseKeys(productId: number, keys: string[], productVariationId?: number | null): Promise<{
    added: number;
}>;
export declare function getLicenseInventory(productId: number): Promise<{
    total: number;
    available: number;
}>;
export declare function listLicenseKeys(productId: number, params: {
    limit?: number;
    offset?: number;
    status?: 'all' | 'available' | 'used';
    product_variation_id?: number;
}): Promise<{
    keys: Array<{
        id: number;
        product_variation_id: number | null;
        license_key: string;
        used_at: string | null;
        order_item_id: number | null;
        created_at: string;
        is_available: boolean;
    }>;
    total: number;
}>;
export declare function updateLicenseKey(productId: number, licenseId: number, nextKey: string, nextVariationId?: number | null): Promise<{
    id: number;
    product_variation_id: number | null;
    license_key: string;
    used_at: string | null;
    order_item_id: number | null;
    created_at: string;
    is_available: boolean;
}>;
export declare function deleteLicenseKey(productId: number, licenseId: number): Promise<void>;
//# sourceMappingURL=productService.d.ts.map