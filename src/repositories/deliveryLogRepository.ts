import { DeliveryLogModel } from '../database/models';
import { nextId } from '../database/counter';

export async function create(
  _conn: unknown,
  data: {
    order_id: number;
    order_item_id: number | null;
    action: string;
    details: Record<string, unknown> | null;
  }
): Promise<number> {
  const id = await nextId('delivery_logs');
  await DeliveryLogModel.create({ id, ...data });
  return id;
}

export async function findByOrderId(orderId: number): Promise<DeliveryLogRow[]> {
  const rows = await DeliveryLogModel.find({ order_id: orderId }).sort({ created_at: 1, id: 1 }).lean();
  return rows.map((r: any) => ({
    id: Number(r.id),
    order_id: Number(r.order_id),
    order_item_id: r.order_item_id ?? null,
    action: String(r.action),
    details: r.details ?? null,
    created_at: r.created_at ? new Date(r.created_at) : new Date(),
  }));
}

interface DeliveryLogRow {
  id: number;
  order_id: number;
  order_item_id: number | null;
  action: string;
  details: Record<string, unknown> | null;
  created_at: Date;
}
