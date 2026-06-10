import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse';
import * as checkoutService from '../services/checkoutService';

export async function createOrder(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const userId = req.user.id;
  const couponCode = req.body.coupon_code ?? null;
  const rawMethod = req.body.payment_method;
  const method =
    typeof rawMethod === 'string' && rawMethod.trim().length > 0 ? rawMethod.trim() : 'manual_bkash';

  const txPrimary = typeof req.body.transaction_id === 'string' ? req.body.transaction_id.trim() : '';
  const txLegacy =
    typeof req.body.bkash_transaction_id === 'string' ? req.body.bkash_transaction_id.trim() : '';
  const transactionIdRaw = txPrimary || txLegacy || null;
  const senderNumber = typeof req.body.sender_number === 'string' ? req.body.sender_number : null;
  const paymentType = typeof req.body.payment_type === 'string' ? req.body.payment_type : null;

  const mobile = typeof req.body.mobile === 'string' ? req.body.mobile.trim() : '';
  const address = typeof req.body.address === 'string' ? req.body.address.trim() : '';

  const order = await checkoutService.createOrder(userId, couponCode, {
    method,
    transactionId: transactionIdRaw,
    senderNumber,
    paymentType,
    mobile,
    address,
  });
  return sendSuccess(res, { order }, 201, 'Order created successfully');
}
