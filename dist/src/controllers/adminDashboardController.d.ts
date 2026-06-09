import { Request, Response } from 'express';
export declare function getDashboardSummary(req: Request, res: Response): Promise<Response>;
export declare function getSalesSummary(req: Request, res: Response): Promise<Response>;
export declare function getOrdersByStatus(req: Request, res: Response): Promise<Response>;
export declare function getRecentOrders(req: Request, res: Response): Promise<Response>;
export declare function updateOrderStatus(req: Request, res: Response): Promise<Response>;
export declare function getEmailLogs(req: Request, res: Response): Promise<Response>;
export declare function getRecentPayments(req: Request, res: Response): Promise<Response>;
export declare function getTopProducts(req: Request, res: Response): Promise<Response>;
export declare function getLowStockLicenseProducts(req: Request, res: Response): Promise<Response>;
export declare function getPendingFulfillmentCount(req: Request, res: Response): Promise<Response>;
export declare function getPendingTicketsCount(req: Request, res: Response): Promise<Response>;
export declare function getOrderDetails(req: Request, res: Response): Promise<Response>;
export declare function getCustomersWithOrders(req: Request, res: Response): Promise<Response>;
export declare function updateCustomer(req: Request, res: Response): Promise<Response>;
export declare function deleteCustomer(req: Request, res: Response): Promise<Response>;
//# sourceMappingURL=adminDashboardController.d.ts.map