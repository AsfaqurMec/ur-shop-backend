import type { EmailLogRow } from '../repositories/emailLogRepository';
import type { AdminDashboardSummary, AdminSalesSummary, AdminOrdersByStatus, AdminRecentOrder, AdminRecentPayment, AdminTopProduct, AdminLowStockLicense, AdminCustomerListItem } from '../types/adminDashboard';
export declare function getDashboardSummary(): Promise<AdminDashboardSummary>;
export declare function getSalesSummary(): Promise<AdminSalesSummary>;
export declare function getOrdersByStatus(): Promise<AdminOrdersByStatus[]>;
export declare function getRecentOrders(limit?: number, offset?: number, status?: string): Promise<{
    orders: AdminRecentOrder[];
    total: number;
}>;
export declare function updateOrderStatus(orderId: number, status: import('../types/order').OrderStatus): Promise<AdminRecentOrder>;
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
export declare function updateCustomer(userId: number, data: {
    email: string;
    name: string;
    mobile?: string | null;
    address?: string | null;
}): Promise<AdminCustomerListItem>;
export declare function deleteCustomer(userId: number): Promise<void>;
export declare function deleteOrder(id: number): Promise<void>;
//# sourceMappingURL=adminDashboardService.d.ts.map