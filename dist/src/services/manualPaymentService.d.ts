import type { PaymentProofAdmin, PaymentProofPublic, PaymentProofStatus } from '../types/payment';
export declare function submitProof(userId: number, orderId: number, data: {
    sender_number?: string | null;
    transaction_id?: string | null;
    paid_amount?: number | null;
}, filePath: string): Promise<PaymentProofPublic>;
/** Mark order paid and run digital fulfillment (after bKash execute or admin proof approval). */
export declare function fulfillOrderAfterSuccessfulPayment(orderId: number): Promise<void>;
export declare function approveProof(adminId: number, proofId: number, ip: string | null): Promise<{
    proof: PaymentProofPublic;
    order_updated: boolean;
}>;
export declare function rejectProof(adminId: number, proofId: number, ip: string | null): Promise<PaymentProofPublic>;
export declare function getProofById(proofId: number): Promise<PaymentProofPublic | null>;
export declare function listPendingProofs(): Promise<PaymentProofAdmin[]>;
export declare function listRecentProofsForAdmin(limit: number, offset: number, status?: PaymentProofStatus, excludePending?: boolean): Promise<{
    proofs: PaymentProofAdmin[];
    total: number;
}>;
export declare function getProofsByOrderId(orderId: number, userId?: number): Promise<PaymentProofPublic[]>;
//# sourceMappingURL=manualPaymentService.d.ts.map