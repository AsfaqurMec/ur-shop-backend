import { OrderModel, PaymentProofModel, UserModel } from '../database/models';
import { nextId } from '../database/counter';
import type { PaymentProofRow, PaymentProofStatus } from '../types/payment';

export type PaymentProofWithUserEmail = PaymentProofRow & {
  user_email: string;
  order_number: string;
  order_total: number | string;
  order_currency: string;
};

function date(v: unknown): Date {
  return v ? new Date(v as string | number | Date) : new Date();
}

function row(doc: any): PaymentProofRow {
  return {
    id: Number(doc.id),
    order_id: Number(doc.order_id),
    user_id: doc.user_id != null ? Number(doc.user_id) : null,
    sender_number: doc.sender_number ?? null,
    transaction_id: doc.transaction_id ?? null,
    paid_amount: doc.paid_amount != null ? Number(doc.paid_amount) : null,
    file_path: doc.file_path ?? null,
    status: (doc.status ?? 'pending') as PaymentProofStatus,
    created_at: date(doc.created_at),
    updated_at: date(doc.updated_at),
  };
}

async function withAdminContext(proofs: any[]): Promise<PaymentProofWithUserEmail[]> {
  const userIds = [...new Set(proofs.map((p) => (p.user_id != null ? Number(p.user_id) : null)).filter((id): id is number => id != null))];
  const orderIds = [...new Set(proofs.map((p) => Number(p.order_id)))];
  const [users, orders] = await Promise.all([
    UserModel.find({ id: { $in: userIds }, deleted_at: null }).lean(),
    OrderModel.find({ id: { $in: orderIds } }).lean(),
  ]);
  const userById = new Map(users.map((u: any) => [Number(u.id), u]));
  const orderById = new Map(orders.map((o: any) => [Number(o.id), o]));
  return proofs.flatMap((proof) => {
    const user = proof.user_id != null ? (userById.get(Number(proof.user_id)) as any) : null;
    const order = orderById.get(Number(proof.order_id)) as any;
    if (!order) return [];
    return [{
      ...row(proof),
      user_email: user?.email ? String(user.email) : (order.shipping_mobile ? String(order.shipping_mobile) : 'Guest'),
      order_number: String(order.order_number),
      order_total: Number(order.total ?? 0),
      order_currency: String(order.currency ?? 'BDT'),
    }];
  });
}

export async function create(data: {
  order_id: number;
  user_id: number | null;
  sender_number: string | null;
  transaction_id: string | null;
  paid_amount: number | null;
  file_path: string | null;
}): Promise<number> {
  const id = await nextId('payment_proofs');
  await PaymentProofModel.create({ id, ...data, status: 'pending' });
  return id;
}

export async function findById(id: number): Promise<PaymentProofRow | null> {
  const doc = await PaymentProofModel.findOne({ id }).lean();
  return doc ? row(doc) : null;
}

export async function findByOrderId(orderId: number): Promise<PaymentProofRow[]> {
  const rows = await PaymentProofModel.find({ order_id: orderId }).sort({ created_at: -1 }).lean();
  return rows.map(row);
}

export async function findAllPending(): Promise<PaymentProofWithUserEmail[]> {
  const rows = await PaymentProofModel.find({ status: 'pending' }).sort({ created_at: 1 }).lean();
  return withAdminContext(rows);
}

function queryForAdmin(options: { status?: PaymentProofStatus; excludePending?: boolean }): Record<string, unknown> {
  const query: Record<string, unknown> = {};
  if (options.status) query.status = options.status;
  if (options.excludePending) query.status = { $ne: 'pending' };
  return query;
}

export async function countRecentForAdmin(options: {
  status?: PaymentProofStatus;
  excludePending?: boolean;
}): Promise<number> {
  return PaymentProofModel.countDocuments(queryForAdmin(options));
}

export async function findRecentForAdmin(options: {
  limit: number;
  offset?: number;
  status?: PaymentProofStatus;
  excludePending?: boolean;
}): Promise<PaymentProofWithUserEmail[]> {
  const rows = await PaymentProofModel.find(queryForAdmin(options))
    .sort({ updated_at: -1 })
    .skip(Math.max(0, options.offset ?? 0))
    .limit(options.limit)
    .lean();
  return withAdminContext(rows);
}

export async function updateStatus(id: number, status: PaymentProofStatus): Promise<boolean> {
  const result = await PaymentProofModel.updateOne({ id }, { $set: { status } });
  return result.modifiedCount > 0;
}
