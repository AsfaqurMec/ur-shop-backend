import { DeliveryModel } from '../database/models';
import { nextId } from '../database/counter';

export type DeliveryStatus = 'pending' | 'processing' | 'delivered' | 'failed';

export interface DeliveryRow {
  id: number;
  order_id: number;
  status: string;
  notes: string | null;
  delivered_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

function date(v: unknown): Date {
  return v ? new Date(v as string | number | Date) : new Date();
}

function row(doc: any): DeliveryRow {
  return {
    id: Number(doc.id),
    order_id: Number(doc.order_id),
    status: String(doc.status),
    notes: doc.notes ?? null,
    delivered_at: doc.delivered_at ? date(doc.delivered_at) : null,
    created_at: date(doc.created_at),
    updated_at: date(doc.updated_at),
  };
}

export async function findByOrderId(orderId: number): Promise<DeliveryRow | null> {
  const doc = await DeliveryModel.findOne({ order_id: orderId }).lean();
  return doc ? row(doc) : null;
}

export async function create(orderId: number, status: DeliveryStatus = 'pending'): Promise<number> {
  const id = await nextId('deliveries');
  await DeliveryModel.create({ id, order_id: orderId, status, notes: null, delivered_at: null });
  return id;
}

export async function updateStatus(orderId: number, status: DeliveryStatus, notes?: string | null): Promise<boolean> {
  const patch: Record<string, unknown> = { status };
  if (notes != null) patch.notes = notes;
  if (status === 'delivered') patch.delivered_at = new Date();
  const result = await DeliveryModel.updateOne({ order_id: orderId }, { $set: patch });
  return result.modifiedCount > 0;
}

export async function createOrUpdateToProcessing(orderId: number): Promise<void> {
  const existing = await findByOrderId(orderId);
  if (existing) await updateStatus(orderId, 'processing');
  else await create(orderId, 'processing');
}

export async function updateStatusWithConnection(
  _conn: unknown,
  orderId: number,
  status: DeliveryStatus,
  notes?: string | null
): Promise<boolean> {
  return updateStatus(orderId, status, notes);
}
