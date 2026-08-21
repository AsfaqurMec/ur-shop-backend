import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse';
import * as adminDashboardService from '../services/adminDashboardService';
import * as dashboardService from '../services/dashboardService';
import * as invoiceService from '../services/invoiceService';

export async function getDashboardSummary(req: Request, res: Response): Promise<Response> {
  const summary = await adminDashboardService.getDashboardSummary();
  return sendSuccess(res, { summary });
}

export async function getSalesSummary(req: Request, res: Response): Promise<Response> {
  const summary = await adminDashboardService.getSalesSummary();
  return sendSuccess(res, { summary });
}

export async function getOrdersByStatus(req: Request, res: Response): Promise<Response> {
  const month = req.query.month != null ? Number(req.query.month) : undefined;
  const year = req.query.year != null ? Number(req.query.year) : undefined;
  const period = typeof req.query.period === 'string' ? req.query.period : undefined;
  const data = await adminDashboardService.getOrdersByStatus({ month, year, period });
  return sendSuccess(res, data);
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
  const status = req.body.status as import('../types/order').OrderStatus;
  const order = await adminDashboardService.updateOrderStatus(orderId, status);
  return sendSuccess(res, { order }, 200, 'Order status updated');
}

export async function updateOrderPaymentStatus(req: Request, res: Response): Promise<Response> {
  const order = await adminDashboardService.updateOrderPaymentStatus(Number(req.params.orderId), req.body.payment_status);
  return sendSuccess(res, { order }, 200, 'Payment status updated');
}

export async function getPaidRevenueHistory(req: Request, res: Response): Promise<Response> {
  const month = req.query.month != null ? Number(req.query.month) : undefined;
  const year = req.query.year != null ? Number(req.query.year) : undefined;
  const period = typeof req.query.period === 'string' ? req.query.period : undefined;
  const days = req.query.days != null ? Number(req.query.days) : undefined;
  const history = await adminDashboardService.getPaidRevenueHistory({ month, year, period, days });
  return sendSuccess(res, { history });
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

export async function downloadOrderInvoice(req: Request, res: Response): Promise<void> {
  const orderId = Number(req.params.orderId);
  const invoice = await invoiceService.createInvoicePdf(null, orderId, true);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}"`);
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).send(invoice.buffer);
}

export async function getCustomersWithOrders(req: Request, res: Response): Promise<Response> {
  const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
  const offset = req.query.offset != null ? Number(req.query.offset) : undefined;
  const result = await adminDashboardService.getCustomersWithOrders(limit, offset);
  return sendSuccess(res, result);
}

export async function getCustomerDetails(req: Request, res: Response): Promise<Response> {
  const userId = Number(req.params.userId);
  const result = await adminDashboardService.getCustomerDetails(userId);
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
  await adminDashboardService.deleteCustomer(userId);
  return sendSuccess(res, {}, 200, 'Customer removed');
}

export async function remove(req: Request, res: Response): Promise<Response> {
  const id = Number(req.params.id);
  await adminDashboardService.deleteOrder(id);
  return sendSuccess(res, { message: 'Order deleted' });
}
