import type { OrderStatus, OrderItemProductType, OrderRow, OrderItemRow, PaymentRow } from '../types/order';
export declare function createOrder(_conn: unknown, data: {
    user_id: number | null;
    order_number?: string;
    status: OrderStatus;
    payment_status?: 'paid' | 'unpaid';
    subtotal: number;
    discount: number;
    coupon_code?: string | null;
    coupon_name?: string | null;
    tax: number;
    total: number;
    currency: string;
    shipping_name?: string | null;
    shipping_mobile?: string | null;
    shipping_address?: string | null;
    shipping_city?: string | null;
    shipping_postal_code?: string | null;
    shipping_address_line2?: string | null;
    shipping_method_id?: string | null;
    shipping_method_title?: string | null;
    shipping_fee?: number;
    guest_token?: string | null;
}): Promise<number>;
export declare function findOrderByGuestToken(orderId: number, guestToken: string): Promise<OrderRow | null>;
export interface OrderItemInput {
    product_id: number;
    product_variation_id?: number | null;
    sku?: string | null;
    product_name: string;
    product_type: OrderItemProductType;
    quantity: number;
    unit_price: number;
    total_price: number;
    purchase_selections: Record<string, string> | null;
    purchase_selections_summary: Array<{
        label: string;
        value: string;
    }> | null;
}
export declare function createOrderItems(_conn: unknown, orderId: number, items: OrderItemInput[]): Promise<void>;
export declare function createPayment(_conn: unknown, data: {
    order_id: number;
    amount: number;
    currency: string;
    status: string;
    gateway: string;
    payment_option_id?: number | null;
    gateway_reference?: string | null;
    bkash_payment_id?: string | null;
}): Promise<number>;
export declare function findOrderById(id: number): Promise<OrderRow | null>;
export interface OrderListRow {
    id: number;
    order_number: string;
    status: string;
    total: number;
    currency: string;
    created_at: Date;
}
export declare function findOrdersByUserId(userId: number, options?: {
    limit?: number;
    offset?: number;
}): Promise<OrderListRow[]>;
export declare function countOrdersByUserId(userId: number): Promise<number>;
export declare function countOrdersByUserIdAndStatus(userId: number, status: OrderStatus): Promise<number>;
export declare function findOrderItems(orderId: number): Promise<OrderItemRow[]>;
export declare function findPaidOrderIdContainingProduct(userId: number, productId: number): Promise<number | null>;
export declare function findPaymentByOrderId(orderId: number): Promise<PaymentRow | null>;
export declare function findPaymentByBkashPaymentId(bkashPaymentId: string): Promise<PaymentRow | null>;
export declare function findExpiredPendingBkashOrderIds(olderThan: Date): Promise<number[]>;
export declare function updatePaymentBkashSession(paymentId: number, data: {
    bkash_payment_id: string;
    gateway_reference?: string | null;
}): Promise<boolean>;
export declare function updatePaymentGatewayReference(paymentId: number, gatewayReference: string): Promise<boolean>;
export declare function tryTransitionOrderToPaid(orderId: number): Promise<boolean>;
export declare function updateOrderStatus(orderId: number, status: string): Promise<boolean>;
export declare function updatePaymentStatus(paymentId: number, status: string): Promise<boolean>;
export declare function deleteOrderById(orderId: number): Promise<void>;
//# sourceMappingURL=orderRepository.d.ts.map