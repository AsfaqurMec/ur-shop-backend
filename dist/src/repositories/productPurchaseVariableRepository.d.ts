export interface PurchaseVariableRow {
    id: number;
    product_id: number;
    var_key: string;
    label: string;
    kind: 'select' | 'email';
    enabled: number;
    required: number;
    sort_order: number;
}
export interface PurchaseVariableOptionRow {
    id: number;
    variable_id: number;
    option_key: string;
    label: string;
    price_adjustment: number;
    sort_order: number;
}
export interface PurchaseVariableWithOptions extends PurchaseVariableRow {
    options: PurchaseVariableOptionRow[];
}
export declare function findVariablesWithOptionsByProductId(productId: number): Promise<PurchaseVariableWithOptions[]>;
export declare function deleteVariablesForProduct(_conn: unknown, productId: number): Promise<void>;
export interface AdminVariableInput {
    var_key: string;
    label: string;
    kind: 'select' | 'email';
    enabled: boolean;
    required: boolean;
    sort_order: number;
    options: Array<{
        option_key: string;
        label: string;
        price_adjustment: number;
        sort_order: number;
    }>;
}
export declare function replaceVariablesForProduct(conn: unknown, productId: number, variables: AdminVariableInput[]): Promise<void>;
//# sourceMappingURL=productPurchaseVariableRepository.d.ts.map