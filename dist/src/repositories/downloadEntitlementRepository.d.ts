export declare function create(_conn: unknown, orderItemId: number, productFileId: number): Promise<number>;
export declare function createMany(_conn: unknown, orderItemId: number, productFileIds: number[]): Promise<void>;
export declare function hasEntitlement(orderItemId: number, productFileId: number): Promise<boolean>;
export declare function findByOrderItemId(orderItemId: number): Promise<{
    product_file_id: number;
}[]>;
export interface EntitlementForUserRow {
    entitlement_id: number;
    order_item_id: number;
    order_id: number;
    order_number: string;
    product_id: number;
    product_name: string;
    product_file_id: number;
    file_name: string;
    file_size: number | null;
    download_limit: number | null;
    expires_at: Date | null;
    created_at: Date;
    download_count: number;
}
export declare function findEntitlementsForUser(userId: number): Promise<EntitlementForUserRow[]>;
export interface EntitlementByIdForUserRow {
    id: number;
    order_item_id: number;
    product_file_id: number;
    user_id: number;
    expires_at: Date | null;
}
export declare function findByIdForUser(entitlementId: number, userId: number): Promise<EntitlementByIdForUserRow | null>;
//# sourceMappingURL=downloadEntitlementRepository.d.ts.map