export declare function create(_conn: unknown, data: {
    order_id: number;
    order_item_id: number | null;
    action: string;
    details: Record<string, unknown> | null;
}): Promise<number>;
export declare function findByOrderId(orderId: number): Promise<DeliveryLogRow[]>;
interface DeliveryLogRow {
    id: number;
    order_id: number;
    order_item_id: number | null;
    action: string;
    details: Record<string, unknown> | null;
    created_at: Date;
}
export {};
//# sourceMappingURL=deliveryLogRepository.d.ts.map