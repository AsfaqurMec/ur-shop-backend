import type { AdminDashboardSummary, AdminSalesSummary, AdminOrdersByStatus, AdminRecentOrder, AdminRecentPayment, AdminTopProduct, AdminLowStockLicense, AdminCustomerListItem } from '../types/adminDashboard';
export declare function getDashboardSummary(): Promise<AdminDashboardSummary>;
export declare function getSalesSummary(): Promise<AdminSalesSummary>;
export declare function getOrdersByStatus(): Promise<AdminOrdersByStatus[]>;
export declare function getRecentOrders(limit: number, offset: number, status?: string): Promise<{
    orders: AdminRecentOrder[];
    total: number;
}>;
export declare function updateOrderStatus(orderId: number, status: 'pending' | 'paid' | 'unpaid'): Promise<boolean>;
export declare function getOrderListItemById(orderId: number): Promise<AdminRecentOrder | null>;
export declare function getRecentPayments(limit: number): Promise<AdminRecentPayment[]>;
export declare function getTopProducts(limit: number): Promise<AdminTopProduct[]>;
export declare function getLowStockLicenseProducts(threshold: number): Promise<AdminLowStockLicense[]>;
export declare function getPendingFulfillmentCount(): Promise<number>;
export declare function getPendingTicketsCount(): Promise<number>;
export declare function getCustomersWithOrders(limit: number, offset: number): Promise<{
    customers: AdminCustomerListItem[];
    total: number;
}>;
export declare function userHasOrders(userId: number): Promise<boolean>;
export declare function getCustomerAggregateById(userId: number): Promise<AdminCustomerListItem | null>;
//# sourceMappingURL=adminDashboardRepository.d.ts.map