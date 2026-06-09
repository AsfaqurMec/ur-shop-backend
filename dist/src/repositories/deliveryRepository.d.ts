export type DeliveryStatus = 'pending' | 'processing' | 'delivered' | 'failed';
export interface DeliveryRow {
    id: number;
    order_id: number;
    status: string;
    notes: string | null;
    delivered_at: Date | null;
    created_at: Date;
    updated_at: Date;
}
export declare function findByOrderId(orderId: number): Promise<DeliveryRow | null>;
export declare function create(orderId: number, status?: DeliveryStatus): Promise<number>;
export declare function updateStatus(orderId: number, status: DeliveryStatus, notes?: string | null): Promise<boolean>;
export declare function createOrUpdateToProcessing(orderId: number): Promise<void>;
export declare function updateStatusWithConnection(_conn: unknown, orderId: number, status: DeliveryStatus, notes?: string | null): Promise<boolean>;
//# sourceMappingURL=deliveryRepository.d.ts.map