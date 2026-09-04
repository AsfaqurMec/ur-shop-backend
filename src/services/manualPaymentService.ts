import fs from 'fs';
import path from 'path';
import type { Attachment } from 'nodemailer/lib/mailer';
import { env } from '../config';
import { AppError } from '../middlewares/errorHandler';
import { getProductFileAbsolutePath } from '../middlewares/upload';
import * as paymentProofRepo from '../repositories/paymentProofRepository';
import * as orderRepo from '../repositories/orderRepository';
import * as deliveryRepo from '../repositories/deliveryRepository';
import * as auditLogRepo from '../repositories/auditLogRepository';
import * as authRepo from '../repositories/authRepository';
import * as productRepo from '../repositories/productRepository';
import * as fulfillmentQueueRepo from '../repositories/fulfillmentQueueRepository';
import * as deliveryService from './deliveryService';
import * as emailService from './emailService';
import { orderItemEmailParts } from '../utils/orderItemDisplay';
import type {
  PaymentProofAdmin,
  PaymentProofPublic,
  PaymentProofStatus,
} from '../types/payment';
import type { PaymentProofWithUserEmail } from '../repositories/paymentProofRepository';
import * as paymentOptionService from './paymentOptionService';

function toProofPublic(row: {
  id: number;
  order_id: number;
  sender_number: string | null;
  transaction_id: string | null;
  paid_amount: number | null;
  file_path: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}): PaymentProofPublic {
  return {
    id: row.id,
    order_id: row.order_id,
    sender_number: row.sender_number,
    transaction_id: row.transaction_id,
    paid_amount: row.paid_amount != null ? Number(row.paid_amount) : null,
    file_path: row.file_path,
    status: row.status as PaymentProofPublic['status'],
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

function toProofAdmin(row: PaymentProofWithUserEmail): PaymentProofAdmin {
  const base = toProofPublic(row);
  const orderTotal = Number(row.order_total);
  return {
    ...base,
    user_id: row.user_id,
    user_email: row.user_email,
    order_number: row.order_number,
    order_total: Number.isFinite(orderTotal) ? orderTotal : 0,
    order_currency: row.order_currency || 'USD',
  };
}

export async function submitProof(
  userId: number,
  orderId: number,
  data: { sender_number?: string | null; transaction_id?: string | null; paid_amount?: number | null },
  filePath: string
): Promise<PaymentProofPublic> {
  const order = await orderRepo.findOrderById(orderId);
  if (!order) throw new AppError(404, 'Order not found');
  if (order.user_id !== userId) throw new AppError(403, 'Order does not belong to you');
  if (order.status !== 'pending') {
    throw new AppError(400, 'Order is not pending payment');
  }
  const payment = await orderRepo.findPaymentByOrderId(orderId);
  if (!payment) throw new AppError(400, 'No payment record found for this order');
  const isBankProof = await paymentOptionService.isBankProofGateway(payment.gateway);
  if (!isBankProof) throw new AppError(400, 'This order does not use bank transfer payment with proof upload');

  const id = await paymentProofRepo.create({
    order_id: orderId,
    user_id: userId,
    sender_number: data.sender_number?.trim() || null,
    transaction_id: data.transaction_id?.trim() || null,
    paid_amount: data.paid_amount != null ? data.paid_amount : null,
    file_path: filePath,
  });
  const proof = await paymentProofRepo.findById(id);
  if (!proof) throw new AppError(500, 'Failed to create payment proof');
  return toProofPublic(proof);
}

/** Mark order paid and run digital fulfillment (after bKash execute or admin proof approval). */
export async function fulfillOrderAfterSuccessfulPayment(orderId: number): Promise<void> {
  const order = await orderRepo.findOrderById(orderId);
  if (!order) throw new AppError(404, 'Order not found');
  if (order.status === 'paid') return;
  if (order.status !== 'pending') return;
  const payment = await orderRepo.findPaymentByOrderId(orderId);
  if (!payment) throw new AppError(404, 'Payment not found');
  await orderRepo.updatePaymentStatus(payment.id, 'completed');
  const transitioned = await orderRepo.tryTransitionOrderToPaid(orderId);
  if (!transitioned) {
    const again = await orderRepo.findOrderById(orderId);
    if (again?.status === 'paid') return;
    throw new AppError(409, 'Could not finalize order payment. Please contact support with your order number.');
  }
  await deliveryRepo.createOrUpdateToProcessing(orderId);
  await deliveryService.processOrderDelivery(orderId);
  void sendOrderConfirmationEmail(orderId).catch((err) => {
    if (env.nodeEnv !== 'test') console.error('[Mail] Order confirmation failed:', err);
  });
}

export async function approveProof(adminId: number, proofId: number, ip: string | null): Promise<{
  proof: PaymentProofPublic;
  order_updated: boolean;
}> {
  const proof = await paymentProofRepo.findById(proofId);
  if (!proof) throw new AppError(404, 'Payment proof not found');
  if (proof.status !== 'pending') throw new AppError(400, 'Proof is not pending review');

  const order = await orderRepo.findOrderById(proof.order_id);
  if (!order) throw new AppError(404, 'Order not found');
  const payment = await orderRepo.findPaymentByOrderId(proof.order_id);
  if (!payment) throw new AppError(404, 'Payment not found');
  const needsManual = await paymentOptionService.isManualVerificationGateway(payment.gateway);
  if (!needsManual) {
    throw new AppError(400, 'This payment is not awaiting manual verification');
  }

  const oldProofStatus = proof.status;
  await paymentProofRepo.updateStatus(proofId, 'verified');
  await fulfillOrderAfterSuccessfulPayment(proof.order_id);

  await auditLogRepo.create({
    admin_id: adminId,
    user_id: null,
    action: 'payment_proof.approved',
    entity_type: 'payment_proof',
    entity_id: String(proofId),
    old_values: { status: oldProofStatus },
    new_values: { status: 'verified', order_id: proof.order_id, order_status: 'paid' },
    ip,
  });

  const updated = await paymentProofRepo.findById(proofId);
  return {
    proof: toProofPublic(updated!),
    order_updated: true,
  };
}

/** After payment approval: confirmation email to customer, with downloadable files attached when present. */
async function sendOrderConfirmationEmail(orderId: number): Promise<void> {
  const order = await orderRepo.findOrderById(orderId);
  if (!order || order.user_id == null) return;
  const user = await authRepo.findUserById(order.user_id);
  if (!user) return;

  const items = await orderRepo.findOrderItems(orderId);
  const licenseRows = await productRepo.findLicensesByOrderId(orderId);
  const keysByItem = new Map<number, string[]>();
  for (const row of licenseRows) {
    const list = keysByItem.get(row.order_item_id) ?? [];
    list.push(row.license_key);
    keysByItem.set(row.order_item_id, list);
  }

  const licenseGroups = items
    .filter((i) => i.product_type === 'license_key')
    .map((i) => {
      const p = orderItemEmailParts(i.product_name, i.purchase_selections_summary);
      return {
        product_name: p.product_name,
        ...(p.detail_lines.length > 0 ? { detail_lines: p.detail_lines } : {}),
        keys: keysByItem.get(i.id) ?? [],
      };
    })
    .filter((g) => g.keys.length > 0);

  const attachments: Attachment[] = [];
  const usedNames = new Set<string>();
  const attachedPaths = new Set<string>();
  for (const item of items) {
    if (item.product_type !== 'downloadable') continue;
    const files = await productRepo.findProductFilesByProductId(item.product_id);
    for (const f of files) {
      const abs = path.resolve(getProductFileAbsolutePath(f.file_path));
      if (attachedPaths.has(abs)) continue;
      if (!fs.existsSync(abs)) {
        if (env.nodeEnv !== 'test') {
          console.warn('[Mail] Skipping missing product file for attachment:', abs);
        }
        continue;
      }
      attachedPaths.add(abs);
      let fname = (f.file_name || path.basename(f.file_path)).replace(/[^\w.\- ()\[\]]+/g, '_');
      let unique = fname;
      let n = 0;
      while (usedNames.has(unique.toLowerCase())) {
        n += 1;
        unique = `${path.parse(fname).name}-${n}${path.extname(fname)}`;
      }
      usedNames.add(unique.toLowerCase());
      attachments.push({ filename: unique, path: abs });
    }
  }

  const pendingManual = await fulfillmentQueueRepo.countPendingByOrderId(orderId);
  let fulfillmentNote: string | undefined;
  if (pendingManual > 0) {
    fulfillmentNote =
      'Some items are pending manual activation. You can track pending activation status in your dashboard subscriptions area.';
  }

  const fmt = (n: number) => Number(n).toFixed(2);
  const dashboardUrl = env.frontendUrl ? `${env.frontendUrl}/dashboard/orders/${orderId}` : undefined;

  await emailService.sendPaymentApprovedEmail(
    user.email,
    {
      orderNumber: order.order_number,
      customerName: user.name?.trim() || undefined,
      total: fmt(order.total),
      currency: order.currency,
      lines: items.map((i) => {
        const p = orderItemEmailParts(i.product_name, i.purchase_selections_summary);
        return {
          product_name: p.product_name,
          ...(p.detail_lines.length > 0 ? { detail_lines: p.detail_lines } : {}),
          quantity: i.quantity,
          product_type: String(i.product_type),
        };
      }),
      licenseGroups: licenseGroups.length > 0 ? licenseGroups : undefined,
      filesAttached: attachments.length > 0,
      fulfillmentNote,
      dashboardUrl,
    },
    attachments.length > 0 ? { attachments } : undefined
  );
}

export async function rejectProof(adminId: number, proofId: number, ip: string | null): Promise<PaymentProofPublic> {
  const proof = await paymentProofRepo.findById(proofId);
  if (!proof) throw new AppError(404, 'Payment proof not found');
  if (proof.status !== 'pending') throw new AppError(400, 'Proof is not pending review');

  const oldStatus = proof.status;
  await paymentProofRepo.updateStatus(proofId, 'rejected');

  await auditLogRepo.create({
    admin_id: adminId,
    user_id: null,
    action: 'payment_proof.rejected',
    entity_type: 'payment_proof',
    entity_id: String(proofId),
    old_values: { status: oldStatus },
    new_values: { status: 'rejected', order_id: proof.order_id },
    ip,
  });

  const updated = await paymentProofRepo.findById(proofId);
  return toProofPublic(updated!);
}

export async function getProofById(proofId: number): Promise<PaymentProofPublic | null> {
  const proof = await paymentProofRepo.findById(proofId);
  return proof ? toProofPublic(proof) : null;
}

export async function listPendingProofs(): Promise<PaymentProofAdmin[]> {
  const rows = await paymentProofRepo.findAllPending();
  return rows.map(toProofAdmin);
}

export async function listRecentProofsForAdmin(
  limit: number,
  offset: number,
  status?: PaymentProofStatus,
  excludePending?: boolean
): Promise<{ proofs: PaymentProofAdmin[]; total: number }> {
  const safeLimit = Math.min(100, Math.max(1, limit));
  const safeOffset = Math.max(0, offset);
  const [total, rows] = await Promise.all([
    paymentProofRepo.countRecentForAdmin({ status, excludePending }),
    paymentProofRepo.findRecentForAdmin({
      limit: safeLimit,
      offset: safeOffset,
      status,
      excludePending,
    }),
  ]);
  return { proofs: rows.map(toProofAdmin), total };
}

export async function getProofsByOrderId(orderId: number, userId?: number): Promise<PaymentProofPublic[]> {
  const order = await orderRepo.findOrderById(orderId);
  if (!order) return [];
  if (userId != null && order.user_id !== userId) return [];
  const rows = await paymentProofRepo.findByOrderId(orderId);
  return rows.map(toProofPublic);
}
