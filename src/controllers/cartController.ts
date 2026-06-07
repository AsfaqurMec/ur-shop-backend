import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse';
import * as cartService from '../services/cartService';

export async function getCart(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const userId = req.user.id;
  const cart = await cartService.getCart(userId);
  return sendSuccess(res, { cart });
}

export async function addItem(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const userId = req.user.id;
  const { product_id, quantity, selections, variation_id } = req.body;
  const vid = variation_id != null && variation_id !== '' ? Number(variation_id) : null;
  const cart = await cartService.addItem(userId, product_id, quantity, selections, vid);
  return sendSuccess(res, { cart }, 200, 'Item added to cart');
}

export async function updateItem(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const userId = req.user.id;
  const itemId = Number(req.params.itemId);
  const { quantity } = req.body;
  const cart = await cartService.updateItem(userId, itemId, quantity);
  return sendSuccess(res, { cart }, 200, 'Cart updated');
}

export async function removeItem(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const userId = req.user.id;
  const itemId = Number(req.params.itemId);
  const cart = await cartService.removeItem(userId, itemId);
  return sendSuccess(res, { cart }, 200, 'Item removed from cart');
}

export async function clearCart(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const userId = req.user.id;
  const cart = await cartService.clearCart(userId);
  return sendSuccess(res, { cart }, 200, 'Cart cleared');
}
