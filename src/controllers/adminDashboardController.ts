import { Request, Response } from 'express';
import { sendSuccess } from '../utils/apiResponse';
import * as adminDashboardService from '../services/adminDashboardService';
import * as dashboardService from '../services/dashboardService';

export async function getDashboardSummary(req: Request, res: Response): Promise<Response> {
  const summary = await adminDashboardService.getDashboardSummary();
  return sendSuccess(res, { summary });
}

export async function getSalesSummary(req: Request, res: Response): Promise<Response> {
  const summary = await adminDashboardService.getSalesSummary();
  return sendSuccess(res, { summary });
}

export async function getOrdersByStatus(req: Request, res: Response): Promise<Response> {
  const data = await adminDashboardService.getOrdersByStatus();
  return sendSuccess(res, { by_status: data });
}

export async function getRecentOrders(req: Request, res: Response): Promise<Response> {
  const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
  const offset = req.query.offset != null ? Number(req.query.offset) : undefined;
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const result = await adminDashboardService.getRecentOrders(limit, offset, status);
  return sendSuccess(res, result);
}

export async function updateOrderStatus(req: Request, res: Response): Promise<Response> {
  const orderId = Number(req.params.orderId);
  const status = req.body.status as 'pending' | 'paid' | 'unpaid';
  const order = await adminDashboardService.updateOrderStatus(orderId, status);
  return sendSuccess(res, { order }, 200, 'Order status updated');
}

export async function getEmailLogs(req: Request, res: Response): Promise<Response> {
  const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
  const offset = req.query.offset != null ? Number(req.query.offset) : undefined;
  const template = typeof req.query.template === 'string' ? req.query.template : undefined;
  const result = await adminDashboardService.getEmailLogs(limit, offset, template);
  return sendSuccess(res, result);
}

export async function getRecentPayments(req: Request, res: Response): Promise<Response> {
  const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
  const result = await adminDashboardService.getRecentPayments(limit);
  return sendSuccess(res, result);
}

export async function getTopProducts(req: Request, res: Response): Promise<Response> {
  const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
  const result = await adminDashboardService.getTopProducts(limit);
  return sendSuccess(res, result);
}

export async function getLowStockLicenseProducts(req: Request, res: Response): Promise<Response> {
  const threshold = req.query.threshold != null ? Number(req.query.threshold) : undefined;
  const result = await adminDashboardService.getLowStockLicenseProducts(threshold);
  return sendSuccess(res, result);
}

export async function getPendingFulfillmentCount(req: Request, res: Response): Promise<Response> {
  const result = await adminDashboardService.getPendingFulfillmentCount();
  return sendSuccess(res, result);
}

export async function getPendingTicketsCount(req: Request, res: Response): Promise<Response> {
  const result = await adminDashboardService.getPendingTicketsCount();
  return sendSuccess(res, result);
}

export async function getOrderDetails(req: Request, res: Response): Promise<Response> {
  const orderId = Number(req.params.orderId);
  const order = await dashboardService.getOrderDetailsAdmin(orderId);
  return sendSuccess(res, order);
}

export async function getCustomersWithOrders(req: Request, res: Response): Promise<Response> {
  const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
  const offset = req.query.offset != null ? Number(req.query.offset) : undefined;
  const result = await adminDashboardService.getCustomersWithOrders(limit, offset);
  return sendSuccess(res, result);
}

export async function updateCustomer(req: Request, res: Response): Promise<Response> {
  const userId = Number(req.params.userId);
  const { email, name, mobile, address } = req.body as {
    email: string;
    name: string;
    mobile?: string | null;
    address?: string | null;
  };
  const customer = await adminDashboardService.updateCustomer(userId, { email, name, mobile, address });
  return sendSuccess(res, { customer });
}

export async function deleteCustomer(req: Request, res: Response): Promise<Response> {
  const userId = Number(req.params.userId);
 // console.log(req.params.userId);
  
  await adminDashboardService.deleteCustomer(userId);
  return sendSuccess(res, {}, 200, 'Customer removed');
}

export async function remove(req: Request, res: Response): Promise<Response> {
  const id = Number(req.params.id);
  await adminDashboardService.deleteOrder(id);
  return sendSuccess(res, { message: 'Category deleted' });
}
