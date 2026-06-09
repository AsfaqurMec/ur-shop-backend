import type { OrderPublic } from '../types/order';
export interface CreateOrderPaymentDetails {
    /** Must match an enabled payment_options.gateway_key */
    method: string;
    /** Customer wallet / sender number (required for manual MFS). */
    senderNumber?: string | null;
    /** Transaction ID from SMS or app (required for manual MFS). */
    transactionId?: string | null;
    /** Client hint: e.g. `manual` vs `merchant` (stored on payment for admin reference). */
    paymentType?: string | null;
}
export declare function createOrder(userId: number, couponCode?: string | null, paymentInput?: CreateOrderPaymentDetails): Promise<OrderPublic>;
//# sourceMappingURL=checkoutService.d.ts.map