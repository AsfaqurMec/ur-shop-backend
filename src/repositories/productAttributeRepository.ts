import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type { PoolConnection } from 'mysql2/promise';
import pool from '../database/pool';

export type AttributeKind = 'select' | 'text' | 'email';

export interface ProductAttributeRow {
  id: number;
  product_id: number;
  attr_key: string;
  name: string;
  kind: AttributeKind;
  visible_on_page: number;
  used_for_variations: number;
  sort_order: number;
}

export interface ProductAttributeValueRow {
  id: number;
  attribute_id: number;
  value_key: string;
  label: string;
  sort_order: number;
}

export interface AttributeWithValues extends ProductAttributeRow {
  values: ProductAttributeValueRow[];
}

export interface AttributeReplaceInput {
  attr_key: string;
  name: string;
  kind: AttributeKind;
  visible_on_page: boolean;
  used_for_variations: boolean;
  sort_order: number;
  values: Array<{ value_key: string; label: string; sort_order: number }>;
}

export async function findAttributesWithValuesByProductId(productId: number): Promise<AttributeWithValues[]> {
  const [attrRows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, product_id, attr_key, name, kind, visible_on_page, used_for_variations, sort_order
     FROM product_attributes WHERE product_id = ? ORDER BY sort_order ASC, id ASC`,
    [productId]
  );
  const attrs = attrRows as ProductAttributeRow[];
  if (attrs.length === 0) return [];
  const ids = attrs.map((a) => a.id);
  const ph = ids.map(() => '?').join(',');
  const [valRows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, attribute_id, value_key, label, sort_order FROM product_attribute_values
     WHERE attribute_id IN (${ph}) ORDER BY sort_order ASC, id ASC`,
    ids
  );
  const byAttr = new Map<number, ProductAttributeValueRow[]>();
  for (const v of valRows as ProductAttributeValueRow[]) {
    const list = byAttr.get(v.attribute_id) ?? [];
    list.push(v);
    byAttr.set(v.attribute_id, list);
  }
  return attrs.map((a) => ({ ...a, values: byAttr.get(a.id) ?? [] }));
}

export async function productHasAttributes(productId: number): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT 1 FROM product_attributes WHERE product_id = ? LIMIT 1',
    [productId]
  );
  return rows.length > 0;
}

/** Full replace: deletes attributes (cascades values). Caller should clear variations if needed. */
export async function replaceAttributesForProduct(
  conn: PoolConnection,
  productId: number,
  inputs: AttributeReplaceInput[]
): Promise<void> {
  await conn.execute('DELETE FROM product_attributes WHERE product_id = ?', [productId]);
  for (const a of inputs) {
    const [res] = await conn.execute<ResultSetHeader>(
      `INSERT INTO product_attributes (product_id, attr_key, name, kind, visible_on_page, used_for_variations, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        productId,
        a.attr_key,
        a.name,
        a.kind,
        a.visible_on_page ? 1 : 0,
        a.used_for_variations ? 1 : 0,
        a.sort_order,
      ]
    );
    const attrId = res.insertId;
    for (const v of a.values) {
      await conn.execute(
        `INSERT INTO product_attribute_values (attribute_id, value_key, label, sort_order) VALUES (?, ?, ?, ?)`,
        [attrId, v.value_key, v.label, v.sort_order]
      );
    }
  }
}
