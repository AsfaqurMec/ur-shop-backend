import { OrderItemModel, OrderModel, ProductModel, SubscriptionModel, UserModel } from '../database/models';
import { nextId } from '../database/counter';

export interface SubscriptionForUserRow {
  id: number;
  order_id: number;
  order_number: string;
  order_item_id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_variation_id: number | null;
  status: 'pending_activation' | 'active' | 'cancelled' | 'expired';
  current_period_start: Date;
  current_period_end: Date;
  created_at: Date;
}

export interface SubscriptionExpiryReminderRow {
  id: number;
  user_id: number;
  user_email: string;
  product_id: number;
  product_slug: string;
  product_name: string;
  product_variation_id: number | null;
  current_period_end: Date;
}

function date(v: unknown): Date {
  return v ? new Date(v as string | number | Date) : new Date();
}

export async function findByOrderItemId(orderItemId: number): Promise<{ current_period_end: Date } | null> {
  const row = await SubscriptionModel.findOne({ order_item_id: orderItemId }).lean();
  return row ? { current_period_end: date(row.current_period_end) } : null;
}

export async function findByUserId(userId: number): Promise<SubscriptionForUserRow[]> {
  const subs = await SubscriptionModel.find({ user_id: userId }).sort({ current_period_end: 1, created_at: -1 }).lean();
  const orderIds = subs.map((s: any) => Number(s.order_id));
  const itemIds = subs.map((s: any) => Number(s.order_item_id));
  const productIds = subs.map((s: any) => Number(s.product_id));
  const [orders, items, products] = await Promise.all([
    OrderModel.find({ id: { $in: orderIds } }).lean(),
    OrderItemModel.find({ id: { $in: itemIds } }).lean(),
    ProductModel.find({ id: { $in: productIds }, deleted_at: null }).lean(),
  ]);
  const orderById = new Map(orders.map((o: any) => [Number(o.id), o]));
  const itemById = new Map(items.map((i: any) => [Number(i.id), i]));
  const productById = new Map(products.map((p: any) => [Number(p.id), p]));
  return subs.flatMap((sub: any) => {
    const order = orderById.get(Number(sub.order_id)) as any;
    const item = itemById.get(Number(sub.order_item_id)) as any;
    const product = productById.get(Number(sub.product_id)) as any;
    if (!order || !item || !product) return [];
    return [{
      id: Number(sub.id),
      order_id: Number(sub.order_id),
      order_number: String(order.order_number),
      order_item_id: Number(sub.order_item_id),
      product_id: Number(sub.product_id),
      product_name: String(item.product_name),
      product_slug: String(product.slug),
      product_variation_id: item.product_variation_id ?? null,
      status: sub.status as SubscriptionForUserRow['status'],
      current_period_start: date(sub.current_period_start),
      current_period_end: date(sub.current_period_end),
      created_at: date(sub.created_at),
    }];
  });
}

export async function countByUserId(userId: number): Promise<number> {
  return SubscriptionModel.countDocuments({ user_id: userId });
}

export async function existsByOrderItemIdWithConnection(_conn: unknown, orderItemId: number): Promise<boolean> {
  return Boolean(await SubscriptionModel.exists({ order_item_id: orderItemId }));
}

export async function createWithConnection(
  _conn: unknown,
  data: {
    order_id: number;
    order_item_id: number;
    user_id: number;
    product_id: number;
    status?: 'pending_activation' | 'active' | 'cancelled' | 'expired';
    current_period_start: Date;
    current_period_end: Date;
  }
): Promise<number> {
  const id = await nextId('subscriptions');
  await SubscriptionModel.create({
    id,
    ...data,
    status: data.status ?? 'active',
    expiry_reminder_sent_at: null,
  });
  return id;
}

export async function updateStatusByOrderItemIdWithConnection(
  _conn: unknown,
  orderItemId: number,
  status: 'pending_activation' | 'active' | 'cancelled' | 'expired'
): Promise<boolean> {
  const result = await SubscriptionModel.updateOne({ order_item_id: orderItemId }, { $set: { status } });
  return result.modifiedCount > 0;
}

export async function findActiveNeedingExpiryReminderUtc(): Promise<SubscriptionExpiryReminderRow[]> {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 2, 0, 0, 0, 0));
  const subs = await SubscriptionModel.find({
    status: 'active',
    expiry_reminder_sent_at: null,
    current_period_end: { $gte: start, $lt: end },
  }).lean();
  const [users, products, items] = await Promise.all([
    UserModel.find({ id: { $in: subs.map((s: any) => Number(s.user_id)) } }).lean(),
    ProductModel.find({ id: { $in: subs.map((s: any) => Number(s.product_id)) }, deleted_at: null }).lean(),
    OrderItemModel.find({ id: { $in: subs.map((s: any) => Number(s.order_item_id)) } }).lean(),
  ]);
  const userById = new Map(users.map((u: any) => [Number(u.id), u]));
  const productById = new Map(products.map((p: any) => [Number(p.id), p]));
  const itemById = new Map(items.map((i: any) => [Number(i.id), i]));
  return subs.flatMap((sub: any) => {
    const user = userById.get(Number(sub.user_id)) as any;
    const product = productById.get(Number(sub.product_id)) as any;
    const item = itemById.get(Number(sub.order_item_id)) as any;
    if (!user || !product || !item) return [];
    return [{
      id: Number(sub.id),
      user_id: Number(sub.user_id),
      user_email: String(user.email),
      product_id: Number(sub.product_id),
      product_slug: String(product.slug),
      product_name: String(item.product_name),
      product_variation_id: item.product_variation_id ?? null,
      current_period_end: date(sub.current_period_end),
    }];
  });
}

export async function markExpiryReminderSent(subscriptionId: number): Promise<boolean> {
  const result = await SubscriptionModel.updateOne(
    { id: subscriptionId, expiry_reminder_sent_at: null },
    { $set: { expiry_reminder_sent_at: new Date() } }
  );
  return result.modifiedCount > 0;
}
