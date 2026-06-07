import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../database/pool';

export type PaymentOptionKind = 'manual' | 'merchant';
export type ManualFlow = 'mfs_reference' | 'bank_proof';

export interface PaymentOptionRow {
  id: number;
  kind: PaymentOptionKind;
  gateway_key: string;
  name: string;
  description: string | null;
  is_enabled: number;
  sort_order: number;
  manual_flow: ManualFlow | null;
  bank_details: Record<string, unknown> | null;
  merchant_credentials: Record<string, unknown> | null;
  ui_brand: string | null;
  created_at: Date;
  updated_at: Date;
}

function parseRow(r: RowDataPacket): PaymentOptionRow {
  let bank: Record<string, unknown> | null = null;
  let merch: Record<string, unknown> | null = null;
  if (r.bank_details != null) {
    try {
      bank = typeof r.bank_details === 'string' ? JSON.parse(r.bank_details) : r.bank_details;
    } catch {
      bank = null;
    }
  }
  if (r.merchant_credentials != null) {
    try {
      merch = typeof r.merchant_credentials === 'string' ? JSON.parse(r.merchant_credentials) : r.merchant_credentials;
    } catch {
      merch = null;
    }
  }
  return {
    id: r.id,
    kind: r.kind,
    gateway_key: r.gateway_key,
    name: r.name,
    description: r.description ?? null,
    is_enabled: Number(r.is_enabled),
    sort_order: Number(r.sort_order),
    manual_flow: r.manual_flow ?? null,
    bank_details: bank,
    merchant_credentials: merch,
    ui_brand: r.ui_brand ?? null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

export async function findAll(): Promise<PaymentOptionRow[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, kind, gateway_key, name, description, is_enabled, sort_order, manual_flow,
            bank_details, merchant_credentials, ui_brand, created_at, updated_at
     FROM payment_options ORDER BY sort_order ASC, id ASC`
  );
  return (rows as RowDataPacket[]).map(parseRow);
}

export async function findEnabledPublic(): Promise<PaymentOptionRow[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, kind, gateway_key, name, description, is_enabled, sort_order, manual_flow,
            bank_details, merchant_credentials, ui_brand, created_at, updated_at
     FROM payment_options WHERE is_enabled = 1 ORDER BY sort_order ASC, id ASC`
  );
  return (rows as RowDataPacket[]).map(parseRow);
}

export async function findById(id: number): Promise<PaymentOptionRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, kind, gateway_key, name, description, is_enabled, sort_order, manual_flow,
            bank_details, merchant_credentials, ui_brand, created_at, updated_at
     FROM payment_options WHERE id = ? LIMIT 1`,
    [id]
  );
  const r = rows[0] as RowDataPacket | undefined;
  return r ? parseRow(r) : null;
}

export async function findByGatewayKey(gatewayKey: string): Promise<PaymentOptionRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, kind, gateway_key, name, description, is_enabled, sort_order, manual_flow,
            bank_details, merchant_credentials, ui_brand, created_at, updated_at
     FROM payment_options WHERE gateway_key = ? LIMIT 1`,
    [gatewayKey]
  );
  const r = rows[0] as RowDataPacket | undefined;
  return r ? parseRow(r) : null;
}

export async function findEnabledByGatewayKey(gatewayKey: string): Promise<PaymentOptionRow | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, kind, gateway_key, name, description, is_enabled, sort_order, manual_flow,
            bank_details, merchant_credentials, ui_brand, created_at, updated_at
     FROM payment_options WHERE gateway_key = ? AND is_enabled = 1 LIMIT 1`,
    [gatewayKey]
  );
  const r = rows[0] as RowDataPacket | undefined;
  return r ? parseRow(r) : null;
}

export interface CreatePaymentOptionInput {
  kind: PaymentOptionKind;
  gateway_key: string;
  name: string;
  description?: string | null;
  is_enabled?: boolean;
  sort_order?: number;
  manual_flow?: ManualFlow | null;
  bank_details?: Record<string, unknown> | null;
  merchant_credentials?: Record<string, unknown> | null;
  ui_brand?: string | null;
}

export async function createRow(input: CreatePaymentOptionInput): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO payment_options
      (kind, gateway_key, name, description, is_enabled, sort_order, manual_flow, bank_details, merchant_credentials, ui_brand)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.kind,
      input.gateway_key,
      input.name,
      input.description ?? null,
      input.is_enabled === false ? 0 : 1,
      input.sort_order ?? 0,
      input.manual_flow ?? null,
      input.bank_details != null ? JSON.stringify(input.bank_details) : null,
      input.merchant_credentials != null ? JSON.stringify(input.merchant_credentials) : null,
      input.ui_brand ?? 'generic',
    ]
  );
  return result.insertId;
}

export interface UpdatePaymentOptionInput {
  name?: string;
  description?: string | null;
  is_enabled?: boolean;
  sort_order?: number;
  manual_flow?: ManualFlow | null;
  bank_details?: Record<string, unknown> | null;
  merchant_credentials?: Record<string, unknown> | null;
  ui_brand?: string | null;
}

export async function updateById(id: number, patch: UpdatePaymentOptionInput): Promise<boolean> {
  const fields: string[] = [];
  const vals: unknown[] = [];
  if (patch.name !== undefined) {
    fields.push('name = ?');
    vals.push(patch.name);
  }
  if (patch.description !== undefined) {
    fields.push('description = ?');
    vals.push(patch.description);
  }
  if (patch.is_enabled !== undefined) {
    fields.push('is_enabled = ?');
    vals.push(patch.is_enabled ? 1 : 0);
  }
  if (patch.sort_order !== undefined) {
    fields.push('sort_order = ?');
    vals.push(patch.sort_order);
  }
  if (patch.manual_flow !== undefined) {
    fields.push('manual_flow = ?');
    vals.push(patch.manual_flow);
  }
  if (patch.bank_details !== undefined) {
    fields.push('bank_details = ?');
    vals.push(patch.bank_details != null ? JSON.stringify(patch.bank_details) : null);
  }
  if (patch.merchant_credentials !== undefined) {
    fields.push('merchant_credentials = ?');
    vals.push(patch.merchant_credentials != null ? JSON.stringify(patch.merchant_credentials) : null);
  }
  if (patch.ui_brand !== undefined) {
    fields.push('ui_brand = ?');
    vals.push(patch.ui_brand);
  }
  if (fields.length === 0) return false;
  vals.push(id);
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE payment_options SET ${fields.join(', ')} WHERE id = ?`,
    vals as (string | number | null)[]
  );
  return result.affectedRows > 0;
}

export async function deleteById(id: number): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>('DELETE FROM payment_options WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

export async function countByGatewayKey(gatewayKey: string, excludeId?: number): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    excludeId != null
      ? 'SELECT COUNT(*) AS c FROM payment_options WHERE gateway_key = ? AND id <> ?'
      : 'SELECT COUNT(*) AS c FROM payment_options WHERE gateway_key = ?',
    excludeId != null ? [gatewayKey, excludeId] : [gatewayKey]
  );
  return Number((rows[0] as { c: number }).c) || 0;
}

export async function countByKind(kind: 'manual' | 'merchant'): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT COUNT(*) AS c FROM payment_options WHERE kind = ?',
    [kind]
  );
  return Number((rows[0] as { c: number }).c) || 0;
}
