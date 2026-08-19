import type { AdminDashboardSummary, AdminSalesSummary, AdminOrdersByStatus, AdminRecentOrder, AdminRecentPayment, AdminTopProduct, AdminLowStockLicense, AdminCustomerListItem } from '../types/adminDashboard';
export declare function getDashboardSummary(): Promise<AdminDashboardSummary>;
export declare function getSalesSummary(): Promise<AdminSalesSummary>;
export declare function getOrdersByStatus(): Promise<AdminOrdersByStatus[]>;
export declare function getRecentOrders(limit: number, offset: number, status?: string): Promise<{
    orders: AdminRecentOrder[];
    total: number;
}>;
export declare function updateOrderStatus(orderId: number, status: import('../types/order').OrderStatus): Promise<boolean>;
export declare function updateOrderPaymentStatus(orderId: number, paymentStatus: 'paid' | 'unpaid'): Promise<boolean>;
export declare function getPaidRevenueHistory(days?: number): Promise<Array<{
    date: string;
    revenue: number;
}>>;
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
export declare function softDelete(id: number): Promise<boolean>;
//# sourceMappingURL=adminDashboardRepository.d.ts.map