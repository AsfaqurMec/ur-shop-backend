import { Request, Response } from 'express';
import { sendSuccess } from '../utils/apiResponse';
import * as checkoutService from '../services/checkoutService';
import * as invoiceService from '../services/invoiceService';

export async function createOrder(req: Request, res: Response): Promise<Response> {
  const userId = req.user?.id ?? null;
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

  const name =
    typeof req.body.name === 'string'
      ? req.body.name.trim()
      : typeof req.body.shipping_name === 'string'
        ? req.body.shipping_name.trim()
        : '';
  const mobile = typeof req.body.mobile === 'string' ? req.body.mobile.trim() : '';
  const address = typeof req.body.address === 'string' ? req.body.address.trim() : '';
  const postalCode =
    typeof req.body.postal_code === 'string' ? req.body.postal_code.trim() || null : null;
  const addressLine2 =
    typeof req.body.address_line2 === 'string' ? req.body.address_line2.trim() || null : null;
  const shippingMethodId =
    typeof req.body.shipping_method_id === 'string' ? req.body.shipping_method_id.trim() || null : null;

  const items = Array.isArray(req.body.items) ? req.body.items : undefined;

  const order = await checkoutService.createOrder(userId, couponCode, {
    method,
    transactionId: transactionIdRaw,
    senderNumber,
    paymentType,
    name,
    mobile,
    address,
    postalCode,
    addressLine2,
    shippingMethodId,
    items,
  });
  return sendSuccess(res, { order }, 201, 'Order created successfully');
}

export async function downloadOrderInvoice(req: Request, res: Response): Promise<void> {
  const orderId = Number(req.params.orderId);
  const token = typeof req.query.token === 'string' ? req.query.token.trim() : null;
  const userId = req.user?.id ?? null;
  const isAdmin = req.user?.role === 'admin';

  const invoice = await invoiceService.createInvoicePdf(userId, orderId, isAdmin, token);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${invoice.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}"`
  );
  res.status(200).send(invoice.buffer);
}
