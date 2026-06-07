import type { RowDataPacket } from 'mysql2';
import pool from '../database/pool';
import { env } from '../config';
import * as orderRepo from '../repositories/orderRepository';
import * as couponRepo from '../repositories/couponRepository';
import { isBkashMerchantCleanupActive } from './paymentOptionService';

/** Cancel unpaid bKash (redirect) orders older than configured minutes. */
export async function cancelExpiredBkashPendingOrders(): Promise<number> {
  if (!(await isBkashMerchantCleanupActive())) return 0;
  const minutes = env.bkash.pendingExpiryMinutes;
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT o.id FROM orders o
     INNER JOIN payments p ON p.order_id = o.id AND p.gateway = 'bkash' AND p.status = 'pending'
     WHERE o.status = 'pending'
     AND o.created_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
    [minutes]
  );
  let n = 0;
  for (const r of rows as { id: number }[]) {
    await cancelBkashPendingOrder(r.id);
    n += 1;
  }
  return n;
}

async function cancelBkashPendingOrder(orderId: number): Promise<void> {
  const order = await orderRepo.findOrderById(orderId);
  if (!order || order.status !== 'pending') return;
  const payment = await orderRepo.findPaymentByOrderId(orderId);
  if (!payment || payment.gateway !== 'bkash' || payment.status !== 'pending') return;
  await couponRepo.rollbackCouponsForOrder(orderId);
  await orderRepo.updatePaymentStatus(payment.id, 'failed');
  await orderRepo.updateOrderStatus(orderId, 'cancelled');
}

let interval: ReturnType<typeof setInterval> | null = null;

export function startBkashStaleOrderCleanup(): void {
  if (interval) return;
  const tick = () => {
    cancelExpiredBkashPendingOrders().catch((err) => {
      if (env.nodeEnv !== 'test') console.error('[bKash] Stale order cleanup failed:', err);
    });
  };
  tick();
  interval = setInterval(tick, 60_000);
}
