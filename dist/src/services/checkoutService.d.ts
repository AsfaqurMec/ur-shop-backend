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
    /** Customer contact for delivery. */
    name?: string | null;
    shippingName?: string | null;
    mobile?: string;
    address?: string;
    postalCode?: string | null;
    addressLine2?: string | null;
    shippingMethodId?: string | null;
    /** Guest cart lines passed directly when checking out without an account. */
    items?: Array<{
        product_id: number;
        product_variation_id?: number | null;
        quantity: number;
        selections?: Record<string, string>;
    }>;
}
export declare function createOrder(userId: number | null, couponCode?: string | null, paymentInput?: CreateOrderPaymentDetails): Promise<OrderPublic>;
//# sourceMappingURL=checkoutService.d.ts.map