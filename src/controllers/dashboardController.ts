import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse';
import * as dashboardService from '../services/dashboardService';
import * as invoiceService from '../services/invoiceService';

export async function getMyOrders(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
  const offset = req.query.offset != null ? Number(req.query.offset) : undefined;
  const result = await dashboardService.getMyOrders(req.user.id, { limit, offset });
  return sendSuccess(res, result);
}

export async function getOrderDetails(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const orderId = Number(req.params.orderId);
  const order = await dashboardService.getOrderDetails(req.user.id, orderId);
  return sendSuccess(res, order);
}

export async function downloadOrderInvoice(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    sendError(res, 'Unauthorized', 401);
    return;
  }
  const orderId = Number(req.params.orderId);
  const invoice = await invoiceService.createInvoicePdf(req.user.id, orderId);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}"`);
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).send(invoice.buffer);
}

export async function getMyDownloads(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const result = await dashboardService.getMyDownloads(req.user.id);
  return sendSuccess(res, result);
}

export async function getMyLicenses(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const result = await dashboardService.getMyLicenses(req.user.id);
  return sendSuccess(res, result);
}

export async function getMySubscriptions(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const result = await dashboardService.getMySubscriptions(req.user.id);
  return sendSuccess(res, result);
}

export async function getMyPendingSubscriptions(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const result = await dashboardService.getMyPendingSubscriptions(req.user.id);
  return sendSuccess(res, result);
}

export async function getMyDeliveredItems(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const result = await dashboardService.getMyDeliveredItems(req.user.id);
  return sendSuccess(res, result);
}

export async function getDashboardSummary(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const summary = await dashboardService.getDashboardSummary(req.user.id);
  return sendSuccess(res, { summary });
}
