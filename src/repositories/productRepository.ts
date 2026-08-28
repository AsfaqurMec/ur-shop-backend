import {
  ProductFileModel,
  ProductImageModel,
  ProductLicensePoolModel,
  ProductModel,
  ProductVariationModel,
  OrderItemModel,
  OrderModel,
} from '../database/models';
import { nextId } from '../database/counter';
import type {
  ProductFileRow,
  ProductImageRow,
  ProductLicensePoolRow,
  ProductRow,
  ProductType,
} from '../types/product';

function date(v: unknown): Date {
  return v ? new Date(v as string | number | Date) : new Date();
}

function toProductRow(doc: any): ProductRow {
  return {
    id: Number(doc.id),
    category_id: doc.category_id ?? null,
    name: String(doc.name),
    slug: String(doc.slug),
    description: doc.description ?? null,
    full_description: doc.full_description ?? null,
    size_chart_image: doc.size_chart_image ?? null,
    features: Array.isArray(doc.features) ? JSON.stringify(doc.features) : doc.features ?? null,
    product_type: doc.product_type as ProductType,
    manual_fulfillment_required: Number(doc.manual_fulfillment_required ?? 0),
    price: Number(doc.price ?? 0),
    compare_at_price: doc.compare_at_price != null ? Number(doc.compare_at_price) : null,
    sku: doc.sku ?? null,
    quantity: doc.quantity != null ? Number(doc.quantity) : null,
    default_variation_id: doc.default_variation_id ?? null,
    is_active: Number(doc.is_active ?? 1),
    is_featured: Number(doc.is_featured ?? 0),
    is_trending: Number(doc.is_trending ?? 0),
    trending_order: doc.trending_order != null ? Number(doc.trending_order) : undefined,
    created_at: date(doc.created_at),
    updated_at: date(doc.updated_at),
    deleted_at: doc.deleted_at ? date(doc.deleted_at) : null,
  };
}

function toImageRow(doc: any): ProductImageRow {
  return {
    id: Number(doc.id),
    product_id: Number(doc.product_id),
    path: String(doc.path),
    alt_text: doc.alt_text ?? null,
    sort_order: Number(doc.sort_order ?? 0),
    created_at: date(doc.created_at),
  };
}

function toFileRow(doc: any): ProductFileRow {
  return {
    id: Number(doc.id),
    product_id: Number(doc.product_id),
    file_path: String(doc.file_path),
    file_name: String(doc.file_name),
    file_size: doc.file_size != null ? Number(doc.file_size) : null,
    download_limit: doc.download_limit != null ? Number(doc.download_limit) : null,
    sort_order: Number(doc.sort_order ?? 0),
    created_at: date(doc.created_at),
    updated_at: date(doc.updated_at),
  };
}

function toLicenseRow(doc: any): ProductLicensePoolRow {
  return {
    id: Number(doc.id),
    product_id: Number(doc.product_id),
    product_variation_id: doc.product_variation_id ?? null,
    license_key: String(doc.license_key),
    used_at: doc.used_at ? date(doc.used_at) : null,
    order_item_id: doc.order_item_id ?? null,
    created_at: date(doc.created_at),
  };
}

export async function createProduct(data: {
  category_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  full_description: string | null;
  size_chart_image: string | null;
  features: string[] | null;
  product_type: ProductType;
  manual_fulfillment_required: number;
  price: number;
  compare_at_price: number | null;
  sku?: string | null;
  quantity?: number | null;
  is_active: number;
  is_featured: number;
  is_trending?: number;
}): Promise<number> {
  const id = await nextId('products');
  await ProductModel.create({ id, is_trending: 0, ...data, deleted_at: null });
  return id;
}

export async function updateProduct(
  id: number,
  data: {
    category_id?: number | null;
    name?: string;
    slug?: string;
    description?: string | null;
    full_description?: string | null;
    size_chart_image?: string | null;
    features?: string[] | null;
    product_type?: ProductType;
    manual_fulfillment_required?: number;
    price?: number;
    compare_at_price?: number | null;
    sku?: string | null;
    quantity?: number | null;
    default_variation_id?: number | null;
    is_active?: number;
    is_featured?: number;
    is_trending?: number;
  }
): Promise<void> {
  await ProductModel.updateOne({ id, deleted_at: null }, { $set: data });
}

export async function adjustProductQuantity(productId: number, delta: number): Promise<void> {
  if (delta === 0) return;
  const prod = await ProductModel.findOne({ id: productId, deleted_at: null }).lean();
  if (!prod || prod.quantity == null) return;
  const next = Math.max(0, Number(prod.quantity) + delta);
  await ProductModel.updateOne({ id: productId }, { $set: { quantity: next } });
}

export async function softDeleteProduct(id: number): Promise<boolean> {
  const result = await ProductModel.updateOne({ id, deleted_at: null }, { $set: { deleted_at: new Date() } });
  return result.modifiedCount > 0;
}

export async function findProductById(id: number): Promise<ProductRow | null> {
  const row = await ProductModel.findOne({ id, deleted_at: null }).lean();
  return row ? toProductRow(row) : null;
}

export async function findProductBySlug(slug: string): Promise<ProductRow | null> {
  const row = await ProductModel.findOne({ slug, deleted_at: null }).lean();
  return row ? toProductRow(row) : null;
}

export async function productSlugExists(slug: string, excludeId?: number): Promise<boolean> {
  const query: Record<string, unknown> = { slug, deleted_at: null };
  if (excludeId != null) query.id = { $ne: excludeId };
  return Boolean(await ProductModel.exists(query));
}

export interface ProductListFilters {
  category_id?: number;
  product_type?: ProductType;
  min_price?: number;
  max_price?: number;
  on_sale?: boolean;
  search?: string;
  featured?: boolean;
  trending?: boolean;
  is_active?: boolean;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
}

function productQuery(filters: ProductListFilters): Record<string, unknown> {
  const query: Record<string, unknown> = { deleted_at: null };
  if (filters.category_id != null) query.category_id = filters.category_id;
  if (filters.product_type) query.product_type = filters.product_type;
  if (filters.featured === true) query.is_featured = 1;
  if (filters.trending === true) query.is_trending = 1;
  if (filters.is_active !== undefined) query.is_active = filters.is_active ? 1 : 0;
  if (filters.min_price != null || filters.max_price != null) {
    query.price = {
      ...(filters.min_price != null ? { $gte: filters.min_price } : {}),
      ...(filters.max_price != null ? { $lte: filters.max_price } : {}),
    };
  }
  if (filters.on_sale === true) query.$expr = { $gt: ['$compare_at_price', '$price'] };
  if (filters.search?.trim()) {
    const rx = new RegExp(filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ name: rx }, { slug: rx }, { sku: rx }];
  }
  return query;
}

export async function findProducts(
  filters: ProductListFilters,
  limit: number,
  offset: number
): Promise<ProductRow[]> {
  let sort: Record<string, 1 | -1> =
    filters.sort === 'price_asc' ? { price: 1, created_at: -1 } :
    filters.sort === 'price_desc' ? { price: -1, created_at: -1 } :
    filters.sort === 'name_asc' ? { name: 1, created_at: -1 } :
    filters.sort === 'name_desc' ? { name: -1, created_at: -1 } :
    { is_featured: -1, created_at: -1 };

  if (filters.trending === true) {
    sort = { trending_order: 1, ...sort };
  }

  const rows = await ProductModel.find(productQuery(filters))
    .sort(sort)
    .skip(offset)
    .limit(limit)
    .lean();
  return rows.map(toProductRow);
}

export async function getNeedsPdpConfigMap(productIds: number[]): Promise<Map<number, boolean>> {
  const map = new Map<number, boolean>();
  if (productIds.length === 0) return map;
  const [varRows] = await Promise.all([
    ProductVariationModel.find({ product_id: { $in: productIds }, enabled: 1 }).lean(),
  ]);
  const varSet = new Set(varRows.map((r: any) => Number(r.product_id)));
  productIds.forEach((id) => map.set(id, varSet.has(id)));
  return map;
}

export async function findDefaultVariationStorefrontPricing(
  productIds: number[]
): Promise<Map<number, { price: number; compare_at_price: number | null }>> {
  const map = new Map<number, { price: number; compare_at_price: number | null }>();
  if (productIds.length === 0) return map;
  const products = await ProductModel.find({
    id: { $in: productIds },
    default_variation_id: { $ne: null },
    deleted_at: null,
  }).lean();
  const variationIds = products.map((p: any) => Number(p.default_variation_id)).filter(Boolean);
  const variations = await ProductVariationModel.find({ id: { $in: variationIds }, enabled: 1 }).lean();
  const byId = new Map(variations.map((v: any) => [Number(v.id), v]));
  for (const p of products as any[]) {
    const v = byId.get(Number(p.default_variation_id)) as any;
    if (v) map.set(Number(p.id), { price: Number(v.price), compare_at_price: v.compare_at_price ?? null });
  }
  return map;
}

export async function countProducts(filters: ProductListFilters): Promise<number> {
  return ProductModel.countDocuments(productQuery(filters));
}

export async function createProductImage(data: {
  product_id: number;
  path: string;
  alt_text: string | null;
  sort_order: number;
}): Promise<number> {
  const id = await nextId('product_images');
  await ProductImageModel.create({ id, ...data, deleted_at: null });
  return id;
}

export async function findProductImagesByProductId(productId: number): Promise<ProductImageRow[]> {
  const rows = await ProductImageModel.find({ product_id: productId, deleted_at: null })
    .sort({ sort_order: 1, id: 1 })
    .lean();
  return rows.map(toImageRow);
}

export async function findProductImagesByProductIds(productIds: number[]): Promise<ProductImageRow[]> {
  if (productIds.length === 0) return [];
  const rows = await ProductImageModel.find({ product_id: { $in: productIds }, deleted_at: null })
    .sort({ sort_order: 1, id: 1 })
    .lean();
  return rows.map(toImageRow);
}

export async function findPrimaryImagePathsByProductIds(productIds: number[]): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  for (const id of productIds) {
    const img = await ProductImageModel.findOne({ product_id: id, deleted_at: null }).sort({ sort_order: 1, id: 1 }).lean();
    if (img?.path) map.set(id, String(img.path));
  }
  return map;
}

export async function deleteProductImage(id: number, productId: number): Promise<boolean> {
  const result = await ProductImageModel.deleteOne({ id, product_id: productId });
  return result.deletedCount > 0;
}

export async function reorderProductImages(productId: number, imageIds: number[]): Promise<void> {
  await Promise.all(
    imageIds.map((id, index) =>
      ProductImageModel.updateOne({ id, product_id: productId }, { sort_order: index })
    )
  );
}

export async function deleteAllProductImagesByProductId(productId: number): Promise<void> {
  await ProductImageModel.deleteMany({ product_id: productId });
}

export async function createProductFile(data: {
  product_id: number;
  file_path: string;
  file_name: string;
  file_size: number | null;
  download_limit: number | null;
  sort_order: number;
}): Promise<number> {
  const id = await nextId('product_files');
  await ProductFileModel.create({ id, ...data, deleted_at: null });
  return id;
}

export async function findProductFilesByProductId(productId: number): Promise<ProductFileRow[]> {
  const rows = await ProductFileModel.find({ product_id: productId, deleted_at: null })
    .sort({ sort_order: 1, id: 1 })
    .lean();
  return rows.map(toFileRow);
}

export async function findProductFileById(id: number, productId: number): Promise<ProductFileRow | null> {
  const row = await ProductFileModel.findOne({ id, product_id: productId, deleted_at: null }).lean();
  return row ? toFileRow(row) : null;
}

export async function findProductFileByIdOnly(id: number): Promise<ProductFileRow | null> {
  const row = await ProductFileModel.findOne({ id, deleted_at: null }).lean();
  return row ? toFileRow(row) : null;
}

export async function deleteProductFile(id: number, productId: number): Promise<boolean> {
  const result = await ProductFileModel.deleteOne({ id, product_id: productId });
  return result.deletedCount > 0;
}

export async function createLicenseKeys(
  productId: number,
  keys: string[],
  productVariationId: number | null
): Promise<number> {
  let inserted = 0;
  for (const key of keys) {
    const exists = await ProductLicensePoolModel.exists({ product_id: productId, license_key: key.trim() });
    if (exists) continue;
    await ProductLicensePoolModel.create({
      id: await nextId('product_license_pools'),
      product_id: productId,
      product_variation_id: productVariationId,
      license_key: key.trim(),
      used_at: null,
      order_item_id: null,
      deleted_at: null,
    });
    inserted += 1;
  }
  return inserted;
}

export async function countAvailableLicensesNoVariation(productId: number): Promise<number> {
  return ProductLicensePoolModel.countDocuments({
    product_id: productId,
    used_at: null,
    product_variation_id: null,
    deleted_at: null,
  });
}

export async function countAvailableLicensesForVariation(
  productId: number,
  productVariationId: number
): Promise<number> {
  return ProductLicensePoolModel.countDocuments({
    product_id: productId,
    product_variation_id: productVariationId,
    used_at: null,
    deleted_at: null,
  });
}

export async function countSellableLicensesWithVariations(productId: number): Promise<number> {
  const variations = await ProductVariationModel.find({ product_id: productId, enabled: 1 }).select({ id: 1 }).lean();
  return ProductLicensePoolModel.countDocuments({
    product_id: productId,
    product_variation_id: { $in: variations.map((v: any) => Number(v.id)) },
    used_at: null,
    deleted_at: null,
  });
}

export async function findLicensePoolByProductId(productId: number): Promise<ProductLicensePoolRow[]> {
  const rows = await ProductLicensePoolModel.find({ product_id: productId, deleted_at: null }).sort({ id: 1 }).lean();
  return rows.map(toLicenseRow);
}

export async function findLicensePoolByProductIdPaged(
  productId: number,
  limit: number,
  offset: number,
  filters?: { status?: 'all' | 'available' | 'used'; product_variation_id?: number }
): Promise<ProductLicensePoolRow[]> {
  const query: Record<string, unknown> = { product_id: productId, deleted_at: null };
  if (filters?.status === 'available') query.used_at = null;
  if (filters?.status === 'used') query.used_at = { $ne: null };
  if (filters?.product_variation_id != null) query.product_variation_id = filters.product_variation_id;
  const rows = await ProductLicensePoolModel.find(query).sort({ id: -1 }).skip(offset).limit(limit).lean();
  return rows.map(toLicenseRow);
}

export async function countLicensePoolByProductId(
  productId: number,
  filters?: { status?: 'all' | 'available' | 'used'; product_variation_id?: number }
): Promise<number> {
  const query: Record<string, unknown> = { product_id: productId, deleted_at: null };
  if (filters?.status === 'available') query.used_at = null;
  if (filters?.status === 'used') query.used_at = { $ne: null };
  if (filters?.product_variation_id != null) query.product_variation_id = filters.product_variation_id;
  return ProductLicensePoolModel.countDocuments(query);
}

export async function findLicenseById(
  productId: number,
  licenseId: number
): Promise<ProductLicensePoolRow | null> {
  const row = await ProductLicensePoolModel.findOne({ product_id: productId, id: licenseId, deleted_at: null }).lean();
  return row ? toLicenseRow(row) : null;
}

export async function updateLicenseKey(
  productId: number,
  licenseId: number,
  fields: { license_key?: string; product_variation_id?: number | null }
): Promise<boolean> {
  const result = await ProductLicensePoolModel.updateOne({ product_id: productId, id: licenseId }, { $set: fields });
  return result.modifiedCount > 0;
}

export async function assignUnassignedLicenseKeysToVariation(
  productId: number,
  productVariationId: number
): Promise<number> {
  const result = await ProductLicensePoolModel.updateMany(
    { product_id: productId, product_variation_id: null, used_at: null },
    { $set: { product_variation_id: productVariationId } }
  );
  return result.modifiedCount;
}

export async function deleteLicenseKey(productId: number, licenseId: number): Promise<boolean> {
  const result = await ProductLicensePoolModel.deleteOne({ product_id: productId, id: licenseId });
  return result.deletedCount > 0;
}

export interface AssignedLicenseForUserRow {
  id: number;
  order_id: number;
  order_number: string;
  order_item_id: number;
  product_id: number;
  product_name: string;
  license_key: string;
  used_at: Date;
}

export interface LicenseKeyForOrderRow {
  order_item_id: number;
  product_name: string;
  license_key: string;
}

export async function findLicensesByOrderId(orderId: number): Promise<LicenseKeyForOrderRow[]> {
  const items = await OrderItemModel.find({ order_id: orderId }).lean();
  const itemMap = new Map(items.map((i: any) => [Number(i.id), i]));
  const rows = await ProductLicensePoolModel.find({ order_item_id: { $in: [...itemMap.keys()] } }).lean();
  return rows.map((r: any) => ({
    order_item_id: Number(r.order_item_id),
    product_name: String(itemMap.get(Number(r.order_item_id))?.product_name ?? ''),
    license_key: String(r.license_key),
  }));
}

export async function findAssignedLicensesForUser(userId: number): Promise<AssignedLicenseForUserRow[]> {
  const orders = await OrderModel.find({ user_id: userId }).lean();
  const orderIds = orders.map((o: any) => Number(o.id));
  const orderMap = new Map(orders.map((o: any) => [Number(o.id), o]));
  const items = await OrderItemModel.find({ order_id: { $in: orderIds } }).lean();
  const itemMap = new Map(items.map((i: any) => [Number(i.id), i]));
  const rows = await ProductLicensePoolModel.find({ order_item_id: { $in: [...itemMap.keys()] }, used_at: { $ne: null } })
    .sort({ used_at: -1 })
    .lean();
  return rows.map((r: any) => {
    const item = itemMap.get(Number(r.order_item_id)) as any;
    const order = orderMap.get(Number(item?.order_id)) as any;
    return {
      id: Number(r.id),
      order_id: Number(item?.order_id),
      order_number: String(order?.order_number ?? ''),
      order_item_id: Number(r.order_item_id),
      product_id: Number(item?.product_id),
      product_name: String(item?.product_name ?? ''),
      license_key: String(r.license_key),
      used_at: date(r.used_at),
    };
  });
}

export async function assignLicenseKeysToOrderItem(
  _conn: unknown,
  productId: number,
  orderItemId: number,
  quantity: number,
  productVariationId: number | null
): Promise<number> {
  const rows = await ProductLicensePoolModel.find({
    product_id: productId,
    product_variation_id: productVariationId,
    used_at: null,
    deleted_at: null,
  })
    .sort({ id: 1 })
    .limit(quantity)
    .lean();
  const ids = rows.map((r: any) => Number(r.id));
  if (ids.length === 0) return 0;
  await ProductLicensePoolModel.updateMany(
    { id: { $in: ids } },
    { $set: { order_item_id: orderItemId, used_at: new Date() } }
  );
  return ids.length;
}
