export interface SubscriptionForUserRow {
    id: number;
    order_id: number;
    order_number: string;
    order_item_id: number;
    product_id: number;
    product_name: string;
    product_slug: string;
    product_variation_id: number | null;
    status: 'pending_activation' | 'active' | 'cancelled' | 'expired';
    current_period_start: Date;
    current_period_end: Date;
    created_at: Date;
}
export interface SubscriptionExpiryReminderRow {
    id: number;
    user_id: number;
    user_email: string;
    product_id: number;
    product_slug: string;
    product_name: string;
    product_variation_id: number | null;
    current_period_end: Date;
}
export declare function findByOrderItemId(orderItemId: number): Promise<{
    current_period_end: Date;
} | null>;
export declare function findByUserId(userId: number): Promise<SubscriptionForUserRow[]>;
export declare function countByUserId(userId: number): Promise<number>;
export declare function existsByOrderItemIdWithConnection(_conn: unknown, orderItemId: number): Promise<boolean>;
export declare function createWithConnection(_conn: unknown, data: {
    order_id: number;
    order_item_id: number;
    user_id: number;
    product_id: number;
    status?: 'pending_activation' | 'active' | 'cancelled' | 'expired';
    current_period_start: Date;
    current_period_end: Date;
}): Promise<number>;
export declare function updateStatusByOrderItemIdWithConnection(_conn: unknown, orderItemId: number, status: 'pending_activation' | 'active' | 'cancelled' | 'expired'): Promise<boolean>;
export declare function findActiveNeedingExpiryReminderUtc(): Promise<SubscriptionExpiryReminderRow[]>;
export declare function markExpiryReminderSent(subscriptionId: number): Promise<boolean>;
//# sourceMappingURL=subscriptionRepository.d.ts.map