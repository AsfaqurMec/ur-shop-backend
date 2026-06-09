export type AttributeKind = 'select' | 'text' | 'email';
export interface ProductAttributeRow {
    id: number;
    product_id: number;
    attr_key: string;
    name: string;
    kind: AttributeKind;
    visible_on_page: number;
    used_for_variations: number;
    sort_order: number;
}
export interface ProductAttributeValueRow {
    id: number;
    attribute_id: number;
    value_key: string;
    label: string;
    sort_order: number;
}
export interface AttributeWithValues extends ProductAttributeRow {
    values: ProductAttributeValueRow[];
}
export interface AttributeReplaceInput {
    attr_key: string;
    name: string;
    kind: AttributeKind;
    visible_on_page: boolean;
    used_for_variations: boolean;
    sort_order: number;
    values: Array<{
        value_key: string;
        label: string;
        sort_order: number;
    }>;
}
export declare function findAttributesWithValuesByProductId(productId: number): Promise<AttributeWithValues[]>;
export declare function productHasAttributes(productId: number): Promise<boolean>;
export declare function replaceAttributesForProduct(_conn: unknown, productId: number, inputs: AttributeReplaceInput[]): Promise<void>;
//# sourceMappingURL=productAttributeRepository.d.ts.map