import type { FulfillmentQueuePublic } from '../types/delivery';
/**
 * Process digital delivery for a paid order. Call after payment is approved.
 * Uses a transaction to:
 * - downloadable: create download_entitlements for each product_file
 * - license_key: assign available keys from pool to order_item
 * - subscription_manual / digital_service: create fulfillment_queue entry
 * - write delivery_logs for each action
 */
export declare function processOrderDelivery(orderId: number): Promise<{
    processed: number;
    delivery_status: string;
}>;
export declare function getDeliveryLogs(orderId: number): Promise<{
    id: number;
    order_item_id: number | null;
    action: string;
    details: unknown;
    created_at: string;
}[]>;
export declare function listFulfillmentQueue(): Promise<FulfillmentQueuePublic[]>;
export declare function markFulfillmentFulfilled(id: number, adminId: number, notes?: string | null): Promise<FulfillmentQueuePublic>;
export declare function markFulfillmentFailed(id: number, notes?: string | null): Promise<FulfillmentQueuePublic>;
//# sourceMappingURL=deliveryService.d.ts.map