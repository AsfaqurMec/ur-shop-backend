/** Dashboard summary counts for admin overview. */
export interface AdminDashboardSummary {
    orders_total: number;
    orders_paid: number;
    revenue_total: number;
    customers_count: number;
    pending_fulfillment_count: number;
    pending_tickets_count: number;
}
/** Sales summary (e.g. total revenue from completed payments). */
export interface AdminSalesSummary {
    total_revenue: number;
    total_orders_paid: number;
    currency: string;
}
/** Orders grouped by status. */
export interface AdminOrdersByStatus {
    status: string;
    count: number;
}
/** Recent order list item. */
export interface AdminRecentOrder {
    id: number;
    order_number: string;
    status: string;
    total: number;
    currency: string;
    user_id: number;
    created_at: string;
}
/** Recent payment list item. */
export interface AdminRecentPayment {
    id: number;
    order_id: number;
    order_number: string;
    amount: number;
    currency: string;
    gateway: string;
    status: string;
    created_at: string;
}
/** Top product by quantity sold or revenue. */
export interface AdminTopProduct {
    product_id: number;
    product_name: string;
    quantity_sold: number;
    revenue: number;
    currency: string;
}
/** License key product with low available stock. */
export interface AdminLowStockLicense {
    product_id: number;
    product_name: string;
    available_keys: number;
}
/** Customer who has placed at least one order (admin list). */
export interface AdminCustomerListItem {
    user_id: number;
    email: string;
    name: string;
    order_count: number;
    last_order_at: string;
}
//# sourceMappingURL=adminDashboard.d.ts.map