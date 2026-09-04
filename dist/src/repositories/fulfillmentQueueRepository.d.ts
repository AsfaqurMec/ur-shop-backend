import type { FulfillmentQueueProductType, FulfillmentQueueStatus } from '../types/delivery';
export interface FulfillmentQueueRow {
    id: number;
    order_id: number;
    order_item_id: number;
    product_id: number;
    product_type: FulfillmentQueueProductType;
    user_id: number | null;
    status: FulfillmentQueueStatus;
    notes: string | null;
    due_at: Date | null;
    fulfilled_at: Date | null;
    fulfilled_by_admin_id: number | null;
    created_at: Date;
    updated_at: Date;
}
export declare function create(_conn: unknown, data: {
    order_id: number;
    order_item_id: number;
    product_id: number;
    product_type: FulfillmentQueueProductType;
    user_id: number | null;
    due_at?: Date | null;
}): Promise<number>;
export declare function findPending(): Promise<FulfillmentQueueRow[]>;
export declare function countPendingByOrderId(orderId: number): Promise<number>;
export interface FulfillmentForUserRow {
    id: number;
    order_id: number;
    order_number: string;
    order_item_id: number;
    product_id: number;
    product_name: string;
    product_slug: string;
    product_variation_id: number | null;
    product_type: string;
    status: string;
    notes: string | null;
    due_at: Date | null;
    fulfilled_at: Date | null;
    fulfilled_by_admin_id: number | null;
    created_at: Date;
}
export declare function findByUserId(userId: number): Promise<FulfillmentForUserRow[]>;
export declare function findById(id: number): Promise<FulfillmentQueueRow | null>;
export declare function findByIdForUpdate(_conn: unknown, id: number): Promise<FulfillmentQueueRow | null>;
export declare function markFulfilledWithConnection(_conn: unknown, id: number, notes?: string | null, fulfilledByAdminId?: number | null): Promise<boolean>;
export declare function markFulfilled(id: number, notes?: string | null): Promise<boolean>;
export declare function markFailed(id: number, notes?: string | null): Promise<boolean>;
//# sourceMappingURL=fulfillmentQueueRepository.d.ts.map