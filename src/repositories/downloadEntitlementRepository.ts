import {
  DownloadEntitlementModel,
  DownloadModel,
  OrderItemModel,
  OrderModel,
  ProductFileModel,
} from '../database/models';
import { nextId } from '../database/counter';

export async function create(_conn: unknown, orderItemId: number, productFileId: number): Promise<number> {
  const existing = await DownloadEntitlementModel.findOne({ order_item_id: orderItemId, product_file_id: productFileId }).lean();
  if (existing) return Number(existing.id);
  const id = await nextId('download_entitlements');
  await DownloadEntitlementModel.create({ id, order_item_id: orderItemId, product_file_id: productFileId, expires_at: null });
  return id;
}

export async function createMany(_conn: unknown, orderItemId: number, productFileIds: number[]): Promise<void> {
  for (const productFileId of productFileIds) await create(null, orderItemId, productFileId);
}

export async function hasEntitlement(orderItemId: number, productFileId: number): Promise<boolean> {
  return Boolean(await DownloadEntitlementModel.exists({ order_item_id: orderItemId, product_file_id: productFileId }));
}

export async function findByOrderItemId(orderItemId: number): Promise<{ product_file_id: number }[]> {
  const rows = await DownloadEntitlementModel.find({ order_item_id: orderItemId }).sort({ product_file_id: 1 }).lean();
  return rows.map((r: any) => ({ product_file_id: Number(r.product_file_id) }));
}

export interface EntitlementForUserRow {
  entitlement_id: number;
  order_item_id: number;
  order_id: number;
  order_number: string;
  product_id: number;
  product_name: string;
  product_file_id: number;
  file_name: string;
  file_size: number | null;
  download_limit: number | null;
  expires_at: Date | null;
  created_at: Date;
  download_count: number;
}

export async function findEntitlementsForUser(userId: number): Promise<EntitlementForUserRow[]> {
  const orders = await OrderModel.find({ user_id: userId }).lean();
  const orderById = new Map(orders.map((o: any) => [Number(o.id), o]));
  const orderIds = [...orderById.keys()];
  const orderItems = await OrderItemModel.find({ order_id: { $in: orderIds } }).lean();
  const itemById = new Map(orderItems.map((i: any) => [Number(i.id), i]));
  const ents = await DownloadEntitlementModel.find({ order_item_id: { $in: [...itemById.keys()] } }).sort({ created_at: -1 }).lean();
  const files = await ProductFileModel.find({ id: { $in: ents.map((e: any) => Number(e.product_file_id)) } }).lean();
  const fileById = new Map(files.map((f: any) => [Number(f.id), f]));
  const out: EntitlementForUserRow[] = [];
  for (const ent of ents as any[]) {
    const item = itemById.get(Number(ent.order_item_id)) as any;
    const order = orderById.get(Number(item?.order_id)) as any;
    const file = fileById.get(Number(ent.product_file_id)) as any;
    if (!item || !order || !file) continue;
    const downloadCount = await DownloadModel.countDocuments({
      order_item_id: Number(ent.order_item_id),
      product_file_id: Number(ent.product_file_id),
    });
    out.push({
      entitlement_id: Number(ent.id),
      order_item_id: Number(ent.order_item_id),
      order_id: Number(item.order_id),
      order_number: String(order.order_number),
      product_id: Number(item.product_id),
      product_name: String(item.product_name),
      product_file_id: Number(ent.product_file_id),
      file_name: String(file.file_name),
      file_size: file.file_size != null ? Number(file.file_size) : null,
      download_limit: file.download_limit != null ? Number(file.download_limit) : null,
      expires_at: ent.expires_at ? new Date(ent.expires_at) : null,
      created_at: ent.created_at ? new Date(ent.created_at) : new Date(),
      download_count: downloadCount,
    });
  }
  return out;
}

export interface EntitlementByIdForUserRow {
  id: number;
  order_item_id: number;
  product_file_id: number;
  user_id: number;
  expires_at: Date | null;
}

export async function findByIdForUser(entitlementId: number, userId: number): Promise<EntitlementByIdForUserRow | null> {
  const ent = await DownloadEntitlementModel.findOne({ id: entitlementId }).lean();
  if (!ent) return null;
  const item = await OrderItemModel.findOne({ id: Number(ent.order_item_id) }).lean();
  if (!item) return null;
  const order = await OrderModel.findOne({ id: Number((item as any).order_id), user_id: userId }).lean();
  if (!order) return null;
  return {
    id: Number(ent.id),
    order_item_id: Number(ent.order_item_id),
    product_file_id: Number(ent.product_file_id),
    user_id: Number((order as any).user_id),
    expires_at: ent.expires_at ? new Date(ent.expires_at) : null,
  };
}
