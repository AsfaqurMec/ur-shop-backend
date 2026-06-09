import type { PurchaseVariableWithOptions } from '../repositories/productPurchaseVariableRepository';
export interface SelectionSummaryLine {
    label: string;
    value: string;
}
/** Stable key order for storing selections and matching cart lines. */
export declare function canonicalSelectionObject(raw: unknown): Record<string, string>;
export declare function selectionsSignature(sel: Record<string, string>): string;
export interface ResolvedLinePricing {
    unit_price: number;
    normalized_selections: Record<string, string>;
    summary: SelectionSummaryLine[];
    /** Catalog variation row used for this line (set when product has variations; may be inferred). */
    effective_variation_id?: number;
}
/**
 * Validates selections and computes unit price (variation price, or base + purchase-variable adjustments).
 */
export declare function resolveLinePricing(productId: number, basePrice: number, rawSelections: unknown, variationId?: number | null): Promise<ResolvedLinePricing>;
export declare function toStorefrontVariable(def: PurchaseVariableWithOptions): {
    var_key: string;
    label: string;
    kind: 'select' | 'email';
    required: boolean;
    sort_order: number;
    options?: Array<{
        option_key: string;
        label: string;
        price_adjustment: number;
        sort_order: number;
    }>;
};
export declare function toAdminVariable(def: PurchaseVariableWithOptions): ReturnType<typeof toStorefrontVariable> & {
    enabled: boolean;
};
//# sourceMappingURL=purchaseSelectionService.d.ts.map