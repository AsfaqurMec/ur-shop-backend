import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type { PoolConnection } from 'mysql2/promise';
import pool from '../database/pool';

export interface PurchaseVariableRow {
  id: number;
  product_id: number;
  var_key: string;
  label: string;
  kind: 'select' | 'email';
  enabled: number;
  required: number;
  sort_order: number;
}

export interface PurchaseVariableOptionRow {
  id: number;
  variable_id: number;
  option_key: string;
  label: string;
  price_adjustment: number;
  sort_order: number;
}

export interface PurchaseVariableWithOptions extends PurchaseVariableRow {
  options: PurchaseVariableOptionRow[];
}

export async function findVariablesWithOptionsByProductId(productId: number): Promise<PurchaseVariableWithOptions[]> {
  const [varRows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, product_id, var_key, label, kind, enabled, required, sort_order
     FROM product_purchase_variables WHERE product_id = ? ORDER BY sort_order ASC, id ASC`,
    [productId]
  );
  const variables = varRows as PurchaseVariableRow[];
  if (variables.length === 0) return [];

  const ids = variables.map((v) => v.id);
  const placeholders = ids.map(() => '?').join(',');
  const [optRows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, variable_id, option_key, label, price_adjustment, sort_order
     FROM product_purchase_variable_options WHERE variable_id IN (${placeholders})
     ORDER BY sort_order ASC, id ASC`,
    ids
  );
  const opts = optRows as PurchaseVariableOptionRow[];
  const byVar = new Map<number, PurchaseVariableOptionRow[]>();
  for (const o of opts) {
    const list = byVar.get(o.variable_id) ?? [];
    list.push(o);
    byVar.set(o.variable_id, list);
  }
  return variables.map((v) => ({
    ...v,
    options: byVar.get(v.id) ?? [],
  }));
}

export async function deleteVariablesForProduct(conn: PoolConnection, productId: number): Promise<void> {
  await conn.execute('DELETE FROM product_purchase_variables WHERE product_id = ?', [productId]);
}

export interface AdminVariableInput {
  var_key: string;
  label: string;
  kind: 'select' | 'email';
  enabled: boolean;
  required: boolean;
  sort_order: number;
  options: Array<{
    option_key: string;
    label: string;
    price_adjustment: number;
    sort_order: number;
  }>;
}

export async function replaceVariablesForProduct(
  conn: PoolConnection,
  productId: number,
  variables: AdminVariableInput[]
): Promise<void> {
  await deleteVariablesForProduct(conn, productId);
  for (const v of variables) {
    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT INTO product_purchase_variables
       (product_id, var_key, label, kind, enabled, required, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        productId,
        v.var_key,
        v.label,
        v.kind,
        v.enabled ? 1 : 0,
        v.required ? 1 : 0,
        v.sort_order,
      ]
    );
    const variableId = result.insertId;
    if (v.kind === 'select') {
      for (const o of v.options) {
        await conn.execute(
          `INSERT INTO product_purchase_variable_options
           (variable_id, option_key, label, price_adjustment, sort_order)
           VALUES (?, ?, ?, ?, ?)`,
          [variableId, o.option_key, o.label, o.price_adjustment, o.sort_order]
        );
      }
    }
  }
}
