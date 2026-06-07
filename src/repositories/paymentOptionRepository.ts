import { PaymentOptionModel } from '../database/models';
import { nextId } from '../database/counter';

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

function date(v: unknown): Date {
  return v ? new Date(v as string | number | Date) : new Date();
}

function parseObject(v: unknown): Record<string, unknown> | null {
  if (v == null) return null;
  if (typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

function parseRow(r: any): PaymentOptionRow {
  return {
    id: Number(r.id),
    kind: r.kind === 'merchant' ? 'merchant' : 'manual',
    gateway_key: String(r.gateway_key),
    name: String(r.name),
    description: r.description ?? null,
    is_enabled: Number(r.is_enabled ?? 1),
    sort_order: Number(r.sort_order ?? 0),
    manual_flow: r.manual_flow ?? null,
    bank_details: parseObject(r.bank_details),
    merchant_credentials: parseObject(r.merchant_credentials),
    ui_brand: r.ui_brand ?? null,
    created_at: date(r.created_at),
    updated_at: date(r.updated_at),
  };
}

export async function findAll(): Promise<PaymentOptionRow[]> {
  const rows = await PaymentOptionModel.find({}).sort({ sort_order: 1, id: 1 }).lean();
  return rows.map(parseRow);
}

export async function findEnabledPublic(): Promise<PaymentOptionRow[]> {
  const rows = await PaymentOptionModel.find({ is_enabled: 1 }).sort({ sort_order: 1, id: 1 }).lean();
  return rows.map(parseRow);
}

export async function findById(id: number): Promise<PaymentOptionRow | null> {
  const row = await PaymentOptionModel.findOne({ id }).lean();
  return row ? parseRow(row) : null;
}

export async function findByGatewayKey(gatewayKey: string): Promise<PaymentOptionRow | null> {
  const row = await PaymentOptionModel.findOne({ gateway_key: gatewayKey }).lean();
  return row ? parseRow(row) : null;
}

export async function findEnabledByGatewayKey(gatewayKey: string): Promise<PaymentOptionRow | null> {
  const row = await PaymentOptionModel.findOne({ gateway_key: gatewayKey, is_enabled: 1 }).lean();
  return row ? parseRow(row) : null;
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
  const id = await nextId('payment_options');
  await PaymentOptionModel.create({
    id,
    kind: input.kind,
    gateway_key: input.gateway_key,
    name: input.name,
    description: input.description ?? null,
    is_enabled: input.is_enabled === false ? 0 : 1,
    sort_order: input.sort_order ?? 0,
    manual_flow: input.manual_flow ?? null,
    bank_details: input.bank_details ?? null,
    merchant_credentials: input.merchant_credentials ?? null,
    ui_brand: input.ui_brand ?? 'generic',
  });
  return id;
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
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) data[key] = key === 'is_enabled' ? (value ? 1 : 0) : value;
  }
  if (Object.keys(data).length === 0) return false;
  const result = await PaymentOptionModel.updateOne({ id }, { $set: data });
  return result.modifiedCount > 0;
}

export async function deleteById(id: number): Promise<boolean> {
  const result = await PaymentOptionModel.deleteOne({ id });
  return result.deletedCount > 0;
}

export async function countByGatewayKey(gatewayKey: string, excludeId?: number): Promise<number> {
  const query: Record<string, unknown> = { gateway_key: gatewayKey };
  if (excludeId != null) query.id = { $ne: excludeId };
  return PaymentOptionModel.countDocuments(query);
}

export async function countByKind(kind: 'manual' | 'merchant'): Promise<number> {
  return PaymentOptionModel.countDocuments({ kind });
}
