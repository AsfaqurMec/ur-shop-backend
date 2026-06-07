import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type { PoolConnection } from 'mysql2/promise';
import pool from '../database/pool';
import type {
  ProductRow,
  ProductImageRow,
  ProductFileRow,
  ProductLicensePoolRow,
  ProductType,
} from '../types/product';

let hasLicenseVariationColumnCache: boolean | null = null;
let hasManualFulfillmentRequiredColumnCache: boolean | null = null;
let hasFullDescriptionColumnCache: boolean | null = null;
let hasFeaturesColumnCache: boolean | null = null;

async function hasLicenseVariationColumn(): Promise<boolean> {
  if (hasLicenseVariationColumnCache != null) return hasLicenseVariationColumnCache;
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS c
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'product_license_pools'
       AND COLUMN_NAME = 'product_variation_id'`
  );
  const exists = Number((rows[0] as { c: number }).c) > 0;
  hasLicenseVariationColumnCache = exists;
  return exists;
}

async function hasManualFulfillmentRequiredColumn(): Promise<boolean> {
  if (hasManualFulfillmentRequiredColumnCache != null) return hasManualFulfillmentRequiredColumnCache;
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS c
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'products'
       AND COLUMN_NAME = 'manual_fulfillment_required'`
  );
  const exists = Number((rows[0] as { c: number }).c) > 0;
  hasManualFulfillmentRequiredColumnCache = exists;
  return exists;
}

async function hasFullDescriptionColumn(): Promise<boolean> {
  if (hasFullDescriptionColumnCache != null) return hasFullDescriptionColumnCache;
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS c
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'products'
       AND COLUMN_NAME = 'full_description'`
  );
  const exists = Number((rows[0] as { c: number }).c) > 0;
  hasFullDescriptionColumnCache = exists;
  return exists;
}

async function hasFeaturesColumn(): Promise<boolean> {
  if (hasFeaturesColumnCache != null) return hasFeaturesColumnCache;
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS c
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'products'
       AND COLUMN_NAME = 'features'`
  );
  const exists = Number((rows[0] as { c: number }).c) > 0;
  hasFeaturesColumnCache = exists;
  return exists;
}

// ---- products ----
export async function createProduct(data: {
  category_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  full_description: string | null;
  features: string[] | null;
  product_type: ProductType;
  manual_fulfillment_required: number;
  price: number;
  compare_at_price: number | null;
  is_active: number;
  is_featured: number;
}): Promise<number> {
  const hasManual = await hasManualFulfillmentRequiredColumn();
  const hasFullDescription = await hasFullDescriptionColumn();
  const hasFeatures = await hasFeaturesColumn();

  const columns = ['category_id', 'name', 'slug', 'description', 'product_type'];
  const placeholders = ['?', '?', '?', '?', '?'];
  const values: Array<number | string | null> = [
    data.category_id,
    data.name,
    data.slug,
    data.description ?? null,
    data.product_type,
  ];

  if (hasFullDescription) {
    columns.push('full_description');
    placeholders.push('?');
    values.push(data.full_description ?? null);
  }
  if (hasFeatures) {
    columns.push('features');
    placeholders.push('?');
    values.push(data.features != null ? JSON.stringify(data.features) : null);
  }
  if (hasManual) {
    columns.push('manual_fulfillment_required');
    placeholders.push('?');
    values.push(data.manual_fulfillment_required);
  }
  columns.push('price', 'compare_at_price', 'is_active', 'is_featured');
  placeholders.push('?', '?', '?', '?');
  values.push(data.price, data.compare_at_price ?? null, data.is_active, data.is_featured);

  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO products (${columns.join(', ')})
     VALUES (${placeholders.join(', ')})`,
    values
  );
  return result.insertId;
}

export async function updateProduct(
  id: number,
  data: {
    category_id?: number | null;
    name?: string;
    slug?: string;
    description?: string | null;
    full_description?: string | null;
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
  }
): Promise<void> {
  const updates: string[] = [];
  const values: (number | string | null)[] = [];
  const hasManual = await hasManualFulfillmentRequiredColumn();
  const hasFullDescription = await hasFullDescriptionColumn();
  const hasFeatures = await hasFeaturesColumn();
  const map: Record<string, keyof typeof data> = {
    category_id: 'category_id',
    name: 'name',
    slug: 'slug',
    description: 'description',
    product_type: 'product_type',
    price: 'price',
    compare_at_price: 'compare_at_price',
    sku: 'sku',
    quantity: 'quantity',
    default_variation_id: 'default_variation_id',
    is_active: 'is_active',
    is_featured: 'is_featured',
  };
  if (hasFullDescription) {
    map.full_description = 'full_description';
  }
  if (hasManual) {
    map.manual_fulfillment_required = 'manual_fulfillment_required';
  }
  for (const [key, prop] of Object.entries(map)) {
    if (data[prop] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(data[prop] as number | string | null);
    }
  }
  if (hasFeatures && data.features !== undefined) {
    updates.push('features = ?');
    values.push(data.features != null ? JSON.stringify(data.features) : null);
  }
  if (updates.length === 0) return;
  values.push(id);
  await pool.execute(
    `UPDATE products SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
    values
  );
}

export async function softDeleteProduct(id: number): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    'UPDATE products SET deleted_at = CURRENT_TIMESTAMP(3) WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  return result.affectedRows > 0;
}

export async function findProductById(id: number): Promise<ProductRow | null> {
  const hasManual = await hasManualFulfillmentRequiredColumn();
  const hasFullDescription = await hasFullDescriptionColumn();
  const hasFeatures = await hasFeaturesColumn();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, category_id, name, slug, description,
      ${hasFullDescription ? 'full_description' : 'NULL AS full_description'},
      ${hasFeatures ? 'features' : 'NULL AS features'},
      product_type, ${hasManual ? 'manual_fulfillment_required' : '0 AS manual_fulfillment_required'}, price, compare_at_price, sku, quantity, default_variation_id, is_active, is_featured, created_at, updated_at, deleted_at
     FROM products WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [id]
  );
  return (rows[0] as ProductRow) ?? null;
}

export async function findProductBySlug(slug: string): Promise<ProductRow | null> {
  const hasManual = await hasManualFulfillmentRequiredColumn();
  const hasFullDescription = await hasFullDescriptionColumn();
  const hasFeatures = await hasFeaturesColumn();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, category_id, name, slug, description,
      ${hasFullDescription ? 'full_description' : 'NULL AS full_description'},
      ${hasFeatures ? 'features' : 'NULL AS features'},
      product_type, ${hasManual ? 'manual_fulfillment_required' : '0 AS manual_fulfillment_required'}, price, compare_at_price, sku, quantity, default_variation_id, is_active, is_featured, created_at, updated_at, deleted_at
     FROM products WHERE slug = ? AND deleted_at IS NULL LIMIT 1`,
    [slug]
  );
  return (rows[0] as ProductRow) ?? null;
}

export async function productSlugExists(slug: string, excludeId?: number): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    excludeId
      ? 'SELECT 1 FROM products WHERE slug = ? AND deleted_at IS NULL AND id != ? LIMIT 1'
      : 'SELECT 1 FROM products WHERE slug = ? AND deleted_at IS NULL LIMIT 1',
    excludeId ? [slug, excludeId] : [slug]
  );
  return rows.length > 0;
}

export interface ProductListFilters {
  category_id?: number;
  product_type?: ProductType;
  min_price?: number;
  max_price?: number;
  search?: string;
  featured?: boolean;
  is_active?: boolean;
}

export async function findProducts(
  filters: ProductListFilters,
  limit: number,
  offset: number
): Promise<ProductRow[]> {
  const conditions: string[] = ['deleted_at IS NULL'];
  const params: (number | string)[] = [];
  if (filters.category_id != null) {
    conditions.push('category_id = ?');
    params.push(filters.category_id);
  }
  if (filters.product_type) {
    conditions.push('product_type = ?');
    params.push(filters.product_type);
  }
  if (filters.min_price != null) {
    conditions.push('price >= ?');
    params.push(filters.min_price);
  }
  if (filters.max_price != null) {
    conditions.push('price <= ?');
    params.push(filters.max_price);
  }
  if (filters.featured === true) {
    conditions.push('is_featured = 1');
  }
  if (filters.is_active !== undefined) {
    conditions.push('is_active = ?');
    params.push(filters.is_active ? 1 : 0);
  }
  if (filters.search?.trim()) {
    conditions.push('(name LIKE ? OR slug LIKE ?)');
    const term = `%${filters.search.trim()}%`;
    params.push(term, term);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit, offset);
  const hasManual = await hasManualFulfillmentRequiredColumn();
  const hasFullDescription = await hasFullDescriptionColumn();
  const hasFeatures = await hasFeaturesColumn();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, category_id, name, slug, description,
      ${hasFullDescription ? 'full_description' : 'NULL AS full_description'},
      ${hasFeatures ? 'features' : 'NULL AS features'},
      product_type, ${hasManual ? 'manual_fulfillment_required' : '0 AS manual_fulfillment_required'}, price, compare_at_price, sku, quantity, default_variation_id, is_active, is_featured, created_at, updated_at, deleted_at
     FROM products ${where} ORDER BY is_featured DESC, created_at DESC LIMIT ? OFFSET ?`,
    params
  );
  return rows as ProductRow[];
}

/** PDP configuration: attributes, enabled variations, or legacy purchase variables. */
export async function getNeedsPdpConfigMap(productIds: number[]): Promise<Map<number, boolean>> {
  const map = new Map<number, boolean>();
  if (productIds.length === 0) return map;
  const unique = [...new Set(productIds)];
  const ph = unique.map(() => '?').join(',');
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT p.id AS id,
      (
        EXISTS (SELECT 1 FROM product_attributes pa WHERE pa.product_id = p.id)
        OR EXISTS (SELECT 1 FROM product_variations pv WHERE pv.product_id = p.id AND pv.enabled = 1)
        OR EXISTS (SELECT 1 FROM product_purchase_variables ppv WHERE ppv.product_id = p.id AND ppv.enabled = 1)
      ) AS needs
     FROM products p WHERE p.id IN (${ph}) AND p.deleted_at IS NULL`,
    unique
  );
  for (const r of rows as { id: number; needs: number }[]) {
    map.set(r.id, Boolean(r.needs));
  }
  return map;
}

/** Storefront list: price/compare from default variation when set and enabled. */
export async function findDefaultVariationStorefrontPricing(
  productIds: number[]
): Promise<Map<number, { price: number; compare_at_price: number | null }>> {
  const map = new Map<number, { price: number; compare_at_price: number | null }>();
  if (productIds.length === 0) return map;
  const unique = [...new Set(productIds)];
  const ph = unique.map(() => '?').join(',');
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT p.id AS product_id, pv.price AS variation_price, pv.compare_at_price AS variation_compare_at
     FROM products p
     INNER JOIN product_variations pv
       ON pv.id = p.default_variation_id AND pv.product_id = p.id
     WHERE p.id IN (${ph})
       AND p.default_variation_id IS NOT NULL
       AND pv.enabled = 1
       AND p.deleted_at IS NULL`,
    unique
  );
  for (const r of rows as RowDataPacket[]) {
    map.set(Number(r.product_id), {
      price: Number(r.variation_price),
      compare_at_price:
        r.variation_compare_at != null ? Number(r.variation_compare_at) : null,
    });
  }
  return map;
}

export async function countProducts(filters: ProductListFilters): Promise<number> {
  const conditions: string[] = ['deleted_at IS NULL'];
  const params: (number | string)[] = [];
  if (filters.category_id != null) {
    conditions.push('category_id = ?');
    params.push(filters.category_id);
  }
  if (filters.product_type) {
    conditions.push('product_type = ?');
    params.push(filters.product_type);
  }
  if (filters.min_price != null) {
    conditions.push('price >= ?');
    params.push(filters.min_price);
  }
  if (filters.max_price != null) {
    conditions.push('price <= ?');
    params.push(filters.max_price);
  }
  if (filters.featured === true) {
    conditions.push('is_featured = 1');
  }
  if (filters.is_active !== undefined) {
    conditions.push('is_active = ?');
    params.push(filters.is_active ? 1 : 0);
  }
  if (filters.search?.trim()) {
    conditions.push('(name LIKE ? OR slug LIKE ?)');
    const term = `%${filters.search.trim()}%`;
    params.push(term, term);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM products ${where}`,
    params
  );
  return (rows[0] as { total: number }).total;
}

// ---- product_images ----
export async function createProductImage(data: {
  product_id: number;
  path: string;
  alt_text: string | null;
  sort_order: number;
}): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO product_images (product_id, path, alt_text, sort_order) VALUES (?, ?, ?, ?)',
    [data.product_id, data.path, data.alt_text ?? null, data.sort_order]
  );
  return result.insertId;
}

export async function findProductImagesByProductId(productId: number): Promise<ProductImageRow[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, product_id, path, alt_text, sort_order, created_at FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC',
    [productId]
  );
  return rows as ProductImageRow[];
}

/** First image per product (by sort_order, then id). Empty map if no ids. */
export async function findPrimaryImagePathsByProductIds(productIds: number[]): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  if (productIds.length === 0) return map;
  const unique = [...new Set(productIds)];
  const placeholders = unique.map(() => '?').join(',');
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT pi1.product_id AS product_id, pi1.path AS path
     FROM product_images pi1
     LEFT JOIN product_images pi2
       ON pi1.product_id = pi2.product_id
       AND (
         pi2.sort_order < pi1.sort_order
         OR (pi2.sort_order = pi1.sort_order AND pi2.id < pi1.id)
       )
     WHERE pi1.product_id IN (${placeholders})
       AND pi2.id IS NULL`,
    unique
  );
  for (const r of rows as { product_id: number; path: string }[]) {
    map.set(r.product_id, r.path);
  }
  return map;
}

export async function deleteProductImage(id: number, productId: number): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM product_images WHERE id = ? AND product_id = ?',
    [id, productId]
  );
  return result.affectedRows > 0;
}

export async function deleteAllProductImagesByProductId(productId: number): Promise<void> {
  await pool.execute<ResultSetHeader>('DELETE FROM product_images WHERE product_id = ?', [productId]);
}

// ---- product_files ----
export async function createProductFile(data: {
  product_id: number;
  file_path: string;
  file_name: string;
  file_size: number | null;
  download_limit: number | null;
  sort_order: number;
}): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO product_files (product_id, file_path, file_name, file_size, download_limit, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.product_id,
      data.file_path,
      data.file_name,
      data.file_size ?? null,
      data.download_limit ?? null,
      data.sort_order,
    ]
  );
  return result.insertId;
}

export async function findProductFilesByProductId(productId: number): Promise<ProductFileRow[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, product_id, file_path, file_name, file_size, download_limit, sort_order, created_at, updated_at
     FROM product_files WHERE product_id = ? ORDER BY sort_order ASC, id ASC`,
    [productId]
  );
  return rows as ProductFileRow[];
}

export async function findProductFileById(id: number, productId: number): Promise<ProductFileRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, product_id, file_path, file_name, file_size, download_limit, sort_order, created_at, updated_at FROM product_files WHERE id = ? AND product_id = ? LIMIT 1',
    [id, productId]
  );
  return (rows[0] as ProductFileRow) ?? null;
}

/** Get product file by id only (e.g. for secure download flow when entitlement gives product_file_id). */
export async function findProductFileByIdOnly(id: number): Promise<ProductFileRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, product_id, file_path, file_name, file_size, download_limit, sort_order, created_at, updated_at FROM product_files WHERE id = ? LIMIT 1',
    [id]
  );
  return (rows[0] as ProductFileRow) ?? null;
}

export async function deleteProductFile(id: number, productId: number): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM product_files WHERE id = ? AND product_id = ?',
    [id, productId]
  );
  return result.affectedRows > 0;
}

// ---- product_license_pools ----
export async function createLicenseKeys(
  productId: number,
  keys: string[],
  productVariationId: number | null
): Promise<number> {
  if (keys.length === 0) return 0;
  const hasVariationCol = await hasLicenseVariationColumn();
  let inserted = 0;
  for (const key of keys) {
    try {
      if (hasVariationCol) {
        await pool.execute(
          'INSERT INTO product_license_pools (product_id, product_variation_id, license_key) VALUES (?, ?, ?)',
          [productId, productVariationId, key.trim()]
        );
      } else {
        await pool.execute(
          'INSERT INTO product_license_pools (product_id, license_key) VALUES (?, ?)',
          [productId, key.trim()]
        );
      }
      inserted += 1;
    } catch {
      // skip duplicate (unique on product_id, license_key)
    }
  }
  return inserted;
}

/** Unused keys for products without catalog variations (pool-level stock). */
export async function countAvailableLicensesNoVariation(productId: number): Promise<number> {
  const hasVariationCol = await hasLicenseVariationColumn();
  if (!hasVariationCol) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM product_license_pools WHERE product_id = ? AND used_at IS NULL',
      [productId]
    );
    return (rows[0] as { total: number }).total;
  }
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT COUNT(*) AS total FROM product_license_pools WHERE product_id = ? AND used_at IS NULL AND product_variation_id IS NULL',
    [productId]
  );
  return (rows[0] as { total: number }).total;
}

/** Unused keys for a specific variation row. */
export async function countAvailableLicensesForVariation(
  productId: number,
  productVariationId: number
): Promise<number> {
  const hasVariationCol = await hasLicenseVariationColumn();
  if (!hasVariationCol) return 0;
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM product_license_pools
     WHERE product_id = ? AND product_variation_id = ? AND used_at IS NULL`,
    [productId, productVariationId]
  );
  return (rows[0] as { total: number }).total;
}

/**
 * Storefront total: unused keys tied to enabled variations (variation-scoped license stock).
 */
export async function countSellableLicensesWithVariations(productId: number): Promise<number> {
  const hasVariationCol = await hasLicenseVariationColumn();
  if (!hasVariationCol) return 0;
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total
     FROM product_license_pools plp
     INNER JOIN product_variations pv ON pv.id = plp.product_variation_id AND pv.product_id = plp.product_id
     WHERE plp.product_id = ?
       AND plp.used_at IS NULL
       AND pv.enabled = 1`,
    [productId]
  );
  return (rows[0] as { total: number }).total;
}

export async function findLicensePoolByProductId(productId: number): Promise<ProductLicensePoolRow[]> {
  const hasVariationCol = await hasLicenseVariationColumn();
  if (!hasVariationCol) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, product_id, license_key, used_at, order_item_id, created_at
       FROM product_license_pools WHERE product_id = ? ORDER BY id ASC`,
      [productId]
    );
    return (rows as RowDataPacket[]).map((r) => ({
      id: Number(r.id),
      product_id: Number(r.product_id),
      product_variation_id: null,
      license_key: String(r.license_key),
      used_at: (r.used_at as Date | null) ?? null,
      order_item_id: (r.order_item_id as number | null) ?? null,
      created_at: r.created_at as Date,
    }));
  }
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, product_id, product_variation_id, license_key, used_at, order_item_id, created_at
     FROM product_license_pools WHERE product_id = ? ORDER BY id ASC`,
    [productId]
  );
  return rows as ProductLicensePoolRow[];
}

export async function findLicensePoolByProductIdPaged(
  productId: number,
  limit: number,
  offset: number,
  filters?: { status?: 'all' | 'available' | 'used'; product_variation_id?: number }
): Promise<ProductLicensePoolRow[]> {
  const status = filters?.status ?? 'all';
  const statusClause = status === 'available' ? 'AND used_at IS NULL' : status === 'used' ? 'AND used_at IS NOT NULL' : '';
  const hasVariationCol = await hasLicenseVariationColumn();
  if (!hasVariationCol) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, product_id, license_key, used_at, order_item_id, created_at
       FROM product_license_pools
       WHERE product_id = ?
       ${statusClause}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [productId, limit, offset]
    );
    return (rows as RowDataPacket[]).map((r) => ({
      id: Number(r.id),
      product_id: Number(r.product_id),
      product_variation_id: null,
      license_key: String(r.license_key),
      used_at: (r.used_at as Date | null) ?? null,
      order_item_id: (r.order_item_id as number | null) ?? null,
      created_at: r.created_at as Date,
    }));
  }
  const variationClause = filters?.product_variation_id != null ? 'AND product_variation_id = ?' : '';
  const params: Array<number> = [productId];
  if (filters?.product_variation_id != null) params.push(filters.product_variation_id);
  params.push(limit, offset);
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, product_id, product_variation_id, license_key, used_at, order_item_id, created_at
     FROM product_license_pools
     WHERE product_id = ?
     ${statusClause}
     ${variationClause}
     ORDER BY id DESC
     LIMIT ? OFFSET ?`,
    params
  );
  return rows as ProductLicensePoolRow[];
}

export async function countLicensePoolByProductId(
  productId: number,
  filters?: { status?: 'all' | 'available' | 'used'; product_variation_id?: number }
): Promise<number> {
  const status = filters?.status ?? 'all';
  const statusClause = status === 'available' ? 'AND used_at IS NULL' : status === 'used' ? 'AND used_at IS NOT NULL' : '';
  const hasVariationCol = await hasLicenseVariationColumn();
  if (!hasVariationCol) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM product_license_pools WHERE product_id = ? ${statusClause}`,
      [productId]
    );
    return Number((rows[0] as { total: number }).total);
  }
  const variationClause = filters?.product_variation_id != null ? 'AND product_variation_id = ?' : '';
  const params: Array<number> = [productId];
  if (filters?.product_variation_id != null) params.push(filters.product_variation_id);
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM product_license_pools
     WHERE product_id = ?
     ${statusClause}
     ${variationClause}`,
    params
  );
  return Number((rows[0] as { total: number }).total);
}

export async function findLicenseById(
  productId: number,
  licenseId: number
): Promise<ProductLicensePoolRow | null> {
  const hasVariationCol = await hasLicenseVariationColumn();
  if (!hasVariationCol) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, product_id, license_key, used_at, order_item_id, created_at
       FROM product_license_pools
       WHERE product_id = ? AND id = ?
       LIMIT 1`,
      [productId, licenseId]
    );
    const row = rows[0] as RowDataPacket | undefined;
    if (!row) return null;
    return {
      id: Number(row.id),
      product_id: Number(row.product_id),
      product_variation_id: null,
      license_key: String(row.license_key),
      used_at: (row.used_at as Date | null) ?? null,
      order_item_id: (row.order_item_id as number | null) ?? null,
      created_at: row.created_at as Date,
    };
  }
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, product_id, product_variation_id, license_key, used_at, order_item_id, created_at
     FROM product_license_pools
     WHERE product_id = ? AND id = ?
     LIMIT 1`,
    [productId, licenseId]
  );
  return (rows[0] as ProductLicensePoolRow) ?? null;
}

export async function updateLicenseKey(
  productId: number,
  licenseId: number,
  fields: { license_key?: string; product_variation_id?: number | null }
): Promise<boolean> {
  const hasVariationCol = await hasLicenseVariationColumn();
  const updates: string[] = [];
  const values: (string | number | null)[] = [];
  if (fields.license_key !== undefined) {
    updates.push('license_key = ?');
    values.push(fields.license_key);
  }
  if (hasVariationCol && fields.product_variation_id !== undefined) {
    updates.push('product_variation_id = ?');
    values.push(fields.product_variation_id);
  }
  if (updates.length === 0) return false;
  values.push(productId, licenseId);
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE product_license_pools SET ${updates.join(', ')} WHERE product_id = ? AND id = ?`,
    values
  );
  return result.affectedRows > 0;
}

/** Legacy repair: rows created before variation column/mapping rollout. */
export async function assignUnassignedLicenseKeysToVariation(
  productId: number,
  productVariationId: number
): Promise<number> {
  const hasVariationCol = await hasLicenseVariationColumn();
  if (!hasVariationCol) return 0;
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE product_license_pools
     SET product_variation_id = ?
     WHERE product_id = ?
       AND product_variation_id IS NULL
       AND used_at IS NULL`,
    [productVariationId, productId]
  );
  return result.affectedRows;
}

export async function deleteLicenseKey(productId: number, licenseId: number): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM product_license_pools WHERE product_id = ? AND id = ?',
    [productId, licenseId]
  );
  return result.affectedRows > 0;
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

/** License keys assigned to line items for a single order (after fulfillment). */
export async function findLicensesByOrderId(orderId: number): Promise<LicenseKeyForOrderRow[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT oi.id AS order_item_id, oi.product_name, plp.license_key
     FROM product_license_pools plp
     JOIN order_items oi ON oi.id = plp.order_item_id
     WHERE oi.order_id = ? AND plp.order_item_id IS NOT NULL
     ORDER BY oi.id ASC, plp.id ASC`,
    [orderId]
  );
  return rows as LicenseKeyForOrderRow[];
}

/** Licenses assigned to the user (order_item_id set, joined via order_items -> orders). */
export async function findAssignedLicensesForUser(userId: number): Promise<AssignedLicenseForUserRow[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT plp.id, oi.order_id, o.order_number, oi.id AS order_item_id, oi.product_id, oi.product_name,
            plp.license_key, plp.used_at
     FROM product_license_pools plp
     JOIN order_items oi ON oi.id = plp.order_item_id
     JOIN orders o ON o.id = oi.order_id
     WHERE o.user_id = ? AND plp.order_item_id IS NOT NULL AND plp.used_at IS NOT NULL
     ORDER BY plp.used_at DESC`,
    [userId]
  );
  return rows as AssignedLicenseForUserRow[];
}

/** Assign up to `quantity` unused license keys to an order_item. Call within transaction. Returns number assigned. */
export async function assignLicenseKeysToOrderItem(
  conn: PoolConnection,
  productId: number,
  orderItemId: number,
  quantity: number,
  productVariationId: number | null
): Promise<number> {
  const hasVariationCol = await hasLicenseVariationColumn();
  const [rows] = hasVariationCol
    ? await conn.execute<RowDataPacket[]>(
        `SELECT id FROM product_license_pools
         WHERE product_id = ? AND used_at IS NULL AND product_variation_id <=> ?
         ORDER BY id ASC LIMIT ? FOR UPDATE`,
        [productId, productVariationId, quantity]
      )
    : await conn.execute<RowDataPacket[]>(
        `SELECT id FROM product_license_pools
         WHERE product_id = ? AND used_at IS NULL
         ORDER BY id ASC LIMIT ? FOR UPDATE`,
        [productId, quantity]
      );
  const ids = (rows as { id: number }[]).map((r) => r.id);
  if (ids.length === 0) return 0;
  const placeholders = ids.map(() => '?').join(',');
  await conn.execute(
    `UPDATE product_license_pools SET order_item_id = ?, used_at = CURRENT_TIMESTAMP(3) WHERE id IN (${placeholders})`,
    [orderItemId, ...ids]
  );
  return ids.length;
}
