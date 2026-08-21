import type { EmailLogRow } from '../repositories/emailLogRepository';
import type { AdminDashboardSummary, AdminSalesSummary, AdminOrdersByStatus, AdminRecentOrder, AdminRecentPayment, AdminTopProduct, AdminLowStockLicense, AdminCustomerListItem } from '../types/adminDashboard';
export declare function getDashboardSummary(): Promise<AdminDashboardSummary>;
export declare function getSalesSummary(): Promise<AdminSalesSummary>;
export declare function getOrdersByStatus(params?: {
    month?: number;
    year?: number;
    period?: string;
}): Promise<{
    by_status: AdminOrdersByStatus[];
    payment_distribution: {
        paid: number;
        unpaid: number;
        total: number;
        paid_revenue: number;
        unpaid_revenue: number;
    };
}>;
export declare function getRecentOrders(limit?: number, offset?: number, status?: string): Promise<{
    orders: AdminRecentOrder[];
    total: number;
}>;
export declare function updateOrderStatus(orderId: number, status: import('../types/order').OrderStatus): Promise<AdminRecentOrder>;
export declare function updateOrderPaymentStatus(orderId: number, paymentStatus: 'paid' | 'unpaid'): Promise<AdminRecentOrder>;
export declare function getPaidRevenueHistory(params?: {
    month?: number;
    year?: number;
    period?: string;
    days?: number;
}): Promise<Array<{
    date: string;
    revenue: number;
}>>;
export declare function getEmailLogs(limit?: number, offset?: number, template?: string): Promise<{
    logs: EmailLogRow[];
    total: number;
    templates: string[];
}>;
export declare function getRecentPayments(limit?: number): Promise<{
    payments: AdminRecentPayment[];
}>;
export declare function getTopProducts(limit?: number): Promise<{
    products: AdminTopProduct[];
}>;
export declare function getLowStockLicenseProducts(threshold?: number): Promise<{
    products: AdminLowStockLicense[];
}>;
export declare function getPendingFulfillmentCount(): Promise<{
    count: number;
}>;
export declare function getPendingTicketsCount(): Promise<{
    count: number;
}>;
export declare function getCustomersWithOrders(limit?: number, offset?: number): Promise<{
    customers: AdminCustomerListItem[];
    total: number;
}>;
export declare function getCustomerDetails(userId: number): Promise<{
    customer: {
        user_id: number;
        email: string;
        name: string;
        mobile: string | null;
        address: string | null;
        created_at: string;
        order_count: number;
        total_spent: number;
        last_order_at: string | null;
    };
    orders: {
        id: number;
        order_number: string;
        status: string;
        payment_status: string;
        gateway: string;
        subtotal: number;
        discount: number;
        coupon_code: any;
        total: number;
        currency: string;
        created_at: string;
        items_count: any;
        items: {
            id: number;
            product_id: number;
            product_name: string;
            sku: any;
            quantity: number;
            unit_price: number;
            total_price: number;
            purchase_selections_summary: any;
        }[];
    }[];
}>;
export declare function updateCustomer(userId: number, data: {
    email: string;
    name: string;
    mobile?: string | null;
    address?: string | null;
}): Promise<AdminCustomerListItem>;
export declare function deleteCustomer(userId: number): Promise<void>;
export declare function deleteOrder(id: number): Promise<void>;
//# sourceMappingURL=adminDashboardService.d.ts.map