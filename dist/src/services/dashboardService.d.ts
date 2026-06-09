import type { DashboardOrderListItem, DashboardOrderDetail, DashboardLicenseItem, DashboardSubscriptionItem, DashboardPendingSubscriptionItem, DashboardDeliveredItem, DashboardSummary } from '../types/dashboard';
/** Get current user's orders list (paginated). */
export declare function getMyOrders(userId: number, options?: {
    limit?: number;
    offset?: number;
}): Promise<{
    orders: DashboardOrderListItem[];
    total: number;
}>;
/** Get order details; ensure order belongs to user. */
export declare function getOrderDetails(userId: number, orderId: number): Promise<DashboardOrderDetail>;
/** Admin: get order details by id (no user check). */
export declare function getOrderDetailsAdmin(orderId: number): Promise<DashboardOrderDetail>;
/** Get my downloads (reuse download service list). */
export declare function getMyDownloads(userId: number): Promise<{
    items: import("../types/download").DownloadableItemPublic[];
}>;
/** Get my licenses (assigned keys from orders). */
export declare function getMyLicenses(userId: number): Promise<{
    items: DashboardLicenseItem[];
}>;
/** Get my subscriptions. */
export declare function getMySubscriptions(userId: number): Promise<{
    items: DashboardSubscriptionItem[];
}>;
/** Get subscriptions that are paid but waiting for manual activation. */
export declare function getMyPendingSubscriptions(userId: number): Promise<{
    items: DashboardPendingSubscriptionItem[];
}>;
/** Get my delivered items: downloads + licenses + subscriptions + fulfilled fulfillments, merged and sorted. */
export declare function getMyDeliveredItems(userId: number): Promise<{
    items: DashboardDeliveredItem[];
}>;
/** Get dashboard summary counts. */
export declare function getDashboardSummary(userId: number): Promise<DashboardSummary>;
//# sourceMappingURL=dashboardService.d.ts.map