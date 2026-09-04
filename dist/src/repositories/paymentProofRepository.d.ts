import type { PaymentProofRow, PaymentProofStatus } from '../types/payment';
export type PaymentProofWithUserEmail = PaymentProofRow & {
    user_email: string;
    order_number: string;
    order_total: number | string;
    order_currency: string;
};
export declare function create(data: {
    order_id: number;
    user_id: number | null;
    sender_number: string | null;
    transaction_id: string | null;
    paid_amount: number | null;
    file_path: string | null;
}): Promise<number>;
export declare function findById(id: number): Promise<PaymentProofRow | null>;
export declare function findByOrderId(orderId: number): Promise<PaymentProofRow[]>;
export declare function findAllPending(): Promise<PaymentProofWithUserEmail[]>;
export declare function countRecentForAdmin(options: {
    status?: PaymentProofStatus;
    excludePending?: boolean;
}): Promise<number>;
export declare function findRecentForAdmin(options: {
    limit: number;
    offset?: number;
    status?: PaymentProofStatus;
    excludePending?: boolean;
}): Promise<PaymentProofWithUserEmail[]>;
export declare function updateStatus(id: number, status: PaymentProofStatus): Promise<boolean>;
//# sourceMappingURL=paymentProofRepository.d.ts.map