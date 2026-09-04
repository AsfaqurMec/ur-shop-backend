import { FulfillmentQueueModel, OrderItemModel, OrderModel, ProductModel } from '../database/models';
import { nextId } from '../database/counter';
import type { FulfillmentQueueProductType, FulfillmentQueueStatus } from '../types/delivery';

export interface FulfillmentQueueRow {
  id: number;
  order_id: number;
  order_item_id: number;
  product_id: number;
  product_type: FulfillmentQueueProductType;
  user_id: number | null;
  status: FulfillmentQueueStatus;
  notes: string | null;
  due_at: Date | null;
  fulfilled_at: Date | null;
  fulfilled_by_admin_id: number | null;
  created_at: Date;
  updated_at: Date;
}

function date(v: unknown): Date {
  return v ? new Date(v as string | number | Date) : new Date();
}

function row(doc: any): FulfillmentQueueRow {
  return {
    id: Number(doc.id),
    order_id: Number(doc.order_id),
    order_item_id: Number(doc.order_item_id),
    product_id: Number(doc.product_id),
    product_type: doc.product_type as FulfillmentQueueProductType,
    user_id: doc.user_id != null ? Number(doc.user_id) : null,
    status: (doc.status ?? 'pending') as FulfillmentQueueStatus,
    notes: doc.notes ?? null,
    due_at: doc.due_at ? date(doc.due_at) : null,
    fulfilled_at: doc.fulfilled_at ? date(doc.fulfilled_at) : null,
    fulfilled_by_admin_id: doc.fulfilled_by_admin_id ?? null,
    created_at: date(doc.created_at),
    updated_at: date(doc.updated_at),
  };
}

export async function create(
  _conn: unknown,
  data: {
    order_id: number;
    order_item_id: number;
    product_id: number;
    product_type: FulfillmentQueueProductType;
    user_id: number | null;
    due_at?: Date | null;
  }
): Promise<number> {
  const id = await nextId('fulfillment_queue');
  await FulfillmentQueueModel.create({
    id,
    ...data,
    due_at: data.due_at ?? null,
    status: 'pending',
    notes: null,
    fulfilled_at: null,
    fulfilled_by_admin_id: null,
  });
  return id;
}

export async function findPending(): Promise<FulfillmentQueueRow[]> {
  const rows = await FulfillmentQueueModel.find({ status: 'pending' }).sort({ created_at: 1, id: 1 }).lean();
  return rows.map(row);
}

export async function countPendingByOrderId(orderId: number): Promise<number> {
  return FulfillmentQueueModel.countDocuments({ order_id: orderId, status: 'pending' });
}

export interface FulfillmentForUserRow {
  id: number;
  order_id: number;
  order_number: string;
  order_item_id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_variation_id: number | null;
  product_type: string;
  status: string;
  notes: string | null;
  due_at: Date | null;
  fulfilled_at: Date | null;
  fulfilled_by_admin_id: number | null;
  created_at: Date;
}

export async function findByUserId(userId: number): Promise<FulfillmentForUserRow[]> {
  const rows = await FulfillmentQueueModel.find({ user_id: userId }).sort({ created_at: -1 }).lean();
  const orderIds = rows.map((r: any) => Number(r.order_id));
  const itemIds = rows.map((r: any) => Number(r.order_item_id));
  const productIds = rows.map((r: any) => Number(r.product_id));
  const [orders, items, products] = await Promise.all([
    OrderModel.find({ id: { $in: orderIds } }).lean(),
    OrderItemModel.find({ id: { $in: itemIds } }).lean(),
    ProductModel.find({ id: { $in: productIds } }).lean(),
  ]);
  const orderById = new Map(orders.map((o: any) => [Number(o.id), o]));
  const itemById = new Map(items.map((i: any) => [Number(i.id), i]));
  const productById = new Map(products.map((p: any) => [Number(p.id), p]));
  return rows.flatMap((r: any) => {
    const order = orderById.get(Number(r.order_id)) as any;
    const item = itemById.get(Number(r.order_item_id)) as any;
    const product = productById.get(Number(r.product_id)) as any;
    if (!order || !item || !product) return [];
    return [{
      id: Number(r.id),
      order_id: Number(r.order_id),
      order_number: String(order.order_number),
      order_item_id: Number(r.order_item_id),
      product_id: Number(r.product_id),
      product_name: String(item.product_name),
      product_slug: String(product.slug),
      product_variation_id: item.product_variation_id ?? null,
      product_type: String(r.product_type),
      status: String(r.status),
      notes: r.notes ?? null,
      due_at: r.due_at ? date(r.due_at) : null,
      fulfilled_at: r.fulfilled_at ? date(r.fulfilled_at) : null,
      fulfilled_by_admin_id: r.fulfilled_by_admin_id ?? null,
      created_at: date(r.created_at),
    }];
  });
}

export async function findById(id: number): Promise<FulfillmentQueueRow | null> {
  const doc = await FulfillmentQueueModel.findOne({ id }).lean();
  return doc ? row(doc) : null;
}

export async function findByIdForUpdate(_conn: unknown, id: number): Promise<FulfillmentQueueRow | null> {
  return findById(id);
}

export async function markFulfilledWithConnection(
  _conn: unknown,
  id: number,
  notes?: string | null,
  fulfilledByAdminId?: number | null
): Promise<boolean> {
  const patch: Record<string, unknown> = { status: 'fulfilled', fulfilled_at: new Date() };
  if (notes != null) patch.notes = notes;
  if (fulfilledByAdminId != null) patch.fulfilled_by_admin_id = fulfilledByAdminId;
  const result = await FulfillmentQueueModel.updateOne({ id, status: 'pending' }, { $set: patch });
  return result.modifiedCount > 0;
}

export async function markFulfilled(id: number, notes?: string | null): Promise<boolean> {
  return markFulfilledWithConnection(null, id, notes);
}

export async function markFailed(id: number, notes?: string | null): Promise<boolean> {
  const patch: Record<string, unknown> = { status: 'failed' };
  if (notes != null) patch.notes = notes;
  const result = await FulfillmentQueueModel.updateOne({ id }, { $set: patch });
  return result.modifiedCount > 0;
}
