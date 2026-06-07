import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse';
import * as deliveryService from '../services/deliveryService';
import * as orderRepo from '../repositories/orderRepository';

export async function processDelivery(req: Request, res: Response): Promise<Response> {
  const orderId = Number(req.params.orderId);
  const result = await deliveryService.processOrderDelivery(orderId);
  return sendSuccess(res, result, 200, 'Delivery processed');
}

/** GET delivery logs for an order. Allowed for admin or order owner. */
export async function getDeliveryLogs(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const orderId = Number(req.params.orderId);
  const order = await orderRepo.findOrderById(orderId);
  if (!order) return sendError(res, 'Order not found', 404);
  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && order.user_id !== req.user.id) {
    return sendError(res, 'Forbidden', 403);
  }
  const logs = await deliveryService.getDeliveryLogs(orderId);
  return sendSuccess(res, { logs });
}

export async function listFulfillmentQueue(req: Request, res: Response): Promise<Response> {
  const items = await deliveryService.listFulfillmentQueue();
  return sendSuccess(res, { items });
}

export async function markFulfillmentFulfilled(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const id = Number(req.params.id);
  const notes = req.body.notes ?? null;
  const item = await deliveryService.markFulfillmentFulfilled(id, req.user.id, notes);
  return sendSuccess(res, { item }, 200, 'Marked as fulfilled');
}

export async function markFulfillmentFailed(req: Request, res: Response): Promise<Response> {
  const id = Number(req.params.id);
  const notes = req.body.notes ?? null;
  const item = await deliveryService.markFulfillmentFailed(id, notes);
  return sendSuccess(res, { item }, 200, 'Marked as failed');
}
