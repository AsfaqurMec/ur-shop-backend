import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse';
import * as orderRepo from '../repositories/orderRepository';
import * as paymentOptionRepo from '../repositories/paymentOptionRepository';
import * as bkashService from '../services/bkashService';
import { mergeBkashCredentials } from '../services/paymentOptionService';
import * as manualPaymentService from '../services/manualPaymentService';

function mergeGatewayReference(existing: string | null, patch: Record<string, unknown>): string {
  let o: Record<string, unknown> = {};
  if (existing?.trim()) {
    try {
      const p = JSON.parse(existing) as unknown;
      if (p && typeof p === 'object' && !Array.isArray(p)) o = p as Record<string, unknown>;
    } catch {
      o = { previous_gateway_reference: existing };
    }
  }
  return JSON.stringify({ ...o, ...patch });
}

/** Finalize bKash Tokenized Checkout after customer returns from bKash (requires auth; order must belong to user). */
export async function executeBkash(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const raw = String(req.body.payment_id ?? req.body.paymentID ?? '').trim();
  if (!raw) return sendError(res, 'payment_id is required', 400);

  const payment = await orderRepo.findPaymentByBkashPaymentId(raw);
  if (!payment?.bkash_payment_id) return sendError(res, 'Payment session not found', 404);

  if (payment.gateway !== 'bkash') {
    return sendError(res, 'This payment session is not a bKash merchant checkout.', 400);
  }

  const order = await orderRepo.findOrderById(payment.order_id);
  if (!order || order.user_id !== req.user.id) return sendError(res, 'Forbidden', 403);

  if (order.status === 'cancelled') {
    return sendError(res, 'This order expired or was cancelled because payment was not completed in time.', 410);
  }

  if (order.status === 'paid') {
    const refreshed = await orderRepo.findOrderById(order.id);
    return sendSuccess(res, {
      order_id: order.id,
      order_number: refreshed?.order_number,
      status: refreshed?.status ?? order.status,
      already_completed: true,
    });
  }

  if (order.status !== 'pending') {
    return sendError(res, 'Order is not awaiting payment completion.', 400);
  }

  const successPayload = async () => {
    const refreshed = await orderRepo.findOrderById(order.id);
    return sendSuccess(res, {
      order_id: order.id,
      order_number: refreshed?.order_number,
      status: refreshed?.status ?? 'paid',
    });
  };

  // Local DB marked completed before order (rare crash mid-flight) — finish fulfillment only.
  if (payment.status === 'completed') {
    await manualPaymentService.fulfillOrderAfterSuccessfulPayment(order.id);
    return successPayload();
  }

  let bkashCfg = mergeBkashCredentials(null);
  if (payment.payment_option_id != null) {
    const opt = await paymentOptionRepo.findById(payment.payment_option_id);
    bkashCfg = mergeBkashCredentials(opt);
  } else {
    const opt = await paymentOptionRepo.findByGatewayKey('bkash');
    bkashCfg = mergeBkashCredentials(opt);
  }
  bkashService.assertBkashConfigured(bkashCfg);

  const { trxID, amountBdt } = await bkashService.executeCheckoutPayment(bkashCfg, raw);

  if (!bkashService.bkashAmountMatchesOrderTotal(Number(order.total), amountBdt)) {
    return sendError(
      res,
      'Payment amount does not match your order total. Please contact support with your order number.',
      400
    );
  }

  await orderRepo.updatePaymentGatewayReference(
    payment.id,
    mergeGatewayReference(payment.gateway_reference, {
      bkash_trx_id: trxID,
      bkash_executed_at: new Date().toISOString(),
    })
  );

  await manualPaymentService.fulfillOrderAfterSuccessfulPayment(order.id);

  return successPayload();
}
