import { env } from '../config';
import { AppError } from '../middlewares/errorHandler';
import * as repo from '../repositories/paymentOptionRepository';
import type { PaymentOptionRow } from '../repositories/paymentOptionRepository';
import type { BankTransferDetailsPublic, PaymentMethodPublic } from '../types/payment';

/** Merged bKash API config (DB merchant_credentials override env when set). */
export interface MergedBkashConfig {
  baseUrl: string;
  username: string;
  password: string;
  appKey: string;
  appSecret: string;
  agreementId: string;
  callbackBaseUrl: string;
}

function pickStr(v: unknown, fallback: string): string {
  if (typeof v !== 'string') return fallback;
  const t = v.trim();
  return t || fallback;
}

/** Merge DB row with env (non-empty DB fields win). */
export function mergeBkashCredentials(row: PaymentOptionRow | null): MergedBkashConfig | null {
  const m = row?.merchant_credentials ?? {};
  const base: MergedBkashConfig = {
    baseUrl: pickStr(m.base_url, env.bkash.baseUrl).replace(/\/$/, ''),
    username: pickStr(m.username, env.bkash.username),
    password: pickStr(m.password, env.bkash.password),
    appKey: pickStr(m.app_key, env.bkash.appKey),
    appSecret: pickStr(m.app_secret, env.bkash.appSecret),
    agreementId: pickStr(m.agreement_id, env.bkash.agreementId),
    callbackBaseUrl: pickStr(m.callback_base_url, env.bkash.callbackBaseUrl).replace(/\/$/, ''),
  };
  if (
    !base.username ||
    !base.password ||
    !base.appKey ||
    !base.appSecret ||
    !base.agreementId ||
    !base.callbackBaseUrl
  ) {
    return null;
  }
  return base;
}

export function isBkashConfigComplete(cfg: MergedBkashConfig | null): boolean {
  return cfg != null;
}

/** Whether bKash stale-order cleanup should run (enabled merchant option or legacy env). */
export async function isBkashMerchantCleanupActive(): Promise<boolean> {
  const rows = await repo.findEnabledPublic();
  const bk = rows.find((r) => r.kind === 'merchant' && r.gateway_key === 'bkash');
  if (bk && mergeBkashCredentials(bk)) return true;
  return env.bkash.enabled && mergeBkashCredentials(null) != null;
}

function bankDetailsFromRow(row: PaymentOptionRow): BankTransferDetailsPublic | null {
  const raw = row.bank_details;
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const bank_name = typeof o.bank_name === 'string' ? o.bank_name : '';
  const account_holder_name = typeof o.account_holder_name === 'string' ? o.account_holder_name : '';
  const account_number = typeof o.account_number === 'string' ? o.account_number : '';
  if (!bank_name || !account_holder_name || !account_number) return null;
  const out: BankTransferDetailsPublic = {
    bank_name,
    account_holder_name,
    account_number,
    routing_number: typeof o.routing_number === 'string' ? o.routing_number : null,
    iban: typeof o.iban === 'string' ? o.iban : null,
    swift_bic: typeof o.swift_bic === 'string' ? o.swift_bic : null,
    payment_reference_hint: typeof o.payment_reference_hint === 'string' ? o.payment_reference_hint : null,
  };
  return out;
}

/** Env overrides for seeded demo numbers (same as previous hardcoded behavior). */
function applyEnvBankDetailOverrides(gatewayKey: string, details: BankTransferDetailsPublic): BankTransferDetailsPublic {
  if (gatewayKey === 'manual_bkash') {
    const name = process.env.BKASH_MANUAL_ACCOUNT_NAME?.trim();
    const num = process.env.BKASH_MANUAL_MERCHANT_NUMBER?.trim();
    return {
      ...details,
      ...(name ? { account_holder_name: name } : {}),
      ...(num ? { account_number: num } : {}),
    };
  }
  if (gatewayKey === 'manual_nagad') {
    const name = process.env.NAGAD_MANUAL_ACCOUNT_NAME?.trim();
    const num = process.env.NAGAD_MANUAL_MERCHANT_NUMBER?.trim();
    return {
      ...details,
      ...(name ? { account_holder_name: name } : {}),
      ...(num ? { account_number: num } : {}),
    };
  }
  if (gatewayKey === 'manual_rocket') {
    const name = process.env.ROCKET_MANUAL_ACCOUNT_NAME?.trim();
    const num = process.env.ROCKET_MANUAL_MERCHANT_NUMBER?.trim();
    return {
      ...details,
      ...(name ? { account_holder_name: name } : {}),
      ...(num ? { account_number: num } : {}),
    };
  }
  return details;
}

function rowToPublic(row: PaymentOptionRow): PaymentMethodPublic {
  const id = `${row.gateway_key}_${row.id}`;
  let bank = bankDetailsFromRow(row);
  if (bank && row.kind === 'manual') {
    bank = applyEnvBankDetailOverrides(row.gateway_key, bank);
  }
  return {
    id,
    name: row.name,
    description: row.description ?? '',
    gateway: row.gateway_key,
    bank_details: bank,
    kind: row.kind,
    manual_flow: row.manual_flow,
    ui_brand: row.ui_brand ?? 'generic',
  };
}

/** Public catalog: enabled options only; omits bKash merchant if credentials incomplete. */
export async function listPublicPaymentMethods(): Promise<PaymentMethodPublic[]> {
  const rows = await repo.findEnabledPublic();
  const out: PaymentMethodPublic[] = [];
  for (const row of rows) {
    if (row.kind === 'merchant' && row.gateway_key === 'bkash') {
      if (!mergeBkashCredentials(row)) continue;
    }
    out.push(rowToPublic(row));
  }
  return out;
}

export async function assertCheckoutGatewayAllowed(gatewayKey: string): Promise<PaymentOptionRow> {
  const row = await repo.findEnabledByGatewayKey(gatewayKey);
  if (!row) {
    throw new AppError(400, 'This payment method is not available');
  }
  if (row.kind === 'merchant' && row.gateway_key === 'bkash') {
    if (!mergeBkashCredentials(row)) {
      throw new AppError(503, 'bKash checkout is not fully configured.');
    }
  }
  return row;
}

export function isMfsReferenceRow(row: PaymentOptionRow): boolean {
  return row.kind === 'manual' && row.manual_flow === 'mfs_reference';
}

export function isBankProofRow(row: PaymentOptionRow): boolean {
  return row.kind === 'manual' && row.manual_flow === 'bank_proof';
}

/** Resolve option by gateway for proof / approval logic (includes disabled for old orders — use findByGatewayKey). */
export async function findOptionForGateway(gatewayKey: string): Promise<PaymentOptionRow | null> {
  return repo.findByGatewayKey(gatewayKey);
}

export async function isManualVerificationGateway(gatewayKey: string): Promise<boolean> {
  const row = await repo.findByGatewayKey(gatewayKey);
  if (!row) {
    return ['manual', 'manual_bkash', 'manual_nagad', 'manual_rocket'].includes(gatewayKey);
  }
  return row.kind === 'manual';
}

export async function isBankProofGateway(gatewayKey: string): Promise<boolean> {
  const row = await repo.findByGatewayKey(gatewayKey);
  if (!row) return gatewayKey === 'manual';
  return isBankProofRow(row);
}

export async function isMfsReferenceGateway(gatewayKey: string): Promise<boolean> {
  const row = await repo.findByGatewayKey(gatewayKey);
  if (!row) {
    return ['manual_bkash', 'manual_nagad', 'manual_rocket'].includes(gatewayKey);
  }
  return isMfsReferenceRow(row);
}

// ---- Admin ----

export interface PaymentOptionAdmin extends PaymentMethodPublic {
  payment_option_id: number;
  is_enabled: boolean;
  sort_order: number;
  merchant_credentials_masked?: MerchantCredentialsMasked | null;
}

export interface MerchantCredentialsMasked {
  username: string;
  app_key: string;
  agreement_id: string;
  base_url: string;
  callback_base_url: string;
  password_set: boolean;
  app_secret_set: boolean;
}

function maskMerchantCredentials(row: PaymentOptionRow): MerchantCredentialsMasked | null {
  if (row.kind !== 'merchant') return null;
  const m = row.merchant_credentials ?? {};
  const pwd = typeof m.password === 'string' && m.password.length > 0;
  const sec = typeof m.app_secret === 'string' && m.app_secret.length > 0;
  return {
    username: typeof m.username === 'string' ? m.username : '',
    app_key: typeof m.app_key === 'string' ? m.app_key : '',
    agreement_id: typeof m.agreement_id === 'string' ? m.agreement_id : '',
    base_url: typeof m.base_url === 'string' ? m.base_url : '',
    callback_base_url: typeof m.callback_base_url === 'string' ? m.callback_base_url : '',
    password_set: pwd,
    app_secret_set: sec,
  };
}

export async function listAllForAdmin(): Promise<PaymentOptionAdmin[]> {
  const rows = await repo.findAll();
  return rows.map((row) => {
    const pub = rowToPublic(row);
    return {
      ...pub,
      payment_option_id: row.id,
      is_enabled: row.is_enabled === 1,
      sort_order: row.sort_order,
      merchant_credentials_masked: maskMerchantCredentials(row),
    };
  });
}

export interface CreatePaymentOptionBody {
  kind: 'manual' | 'merchant';
  gateway_key: string;
  name: string;
  description?: string | null;
  is_enabled?: boolean;
  sort_order?: number;
  manual_flow?: 'mfs_reference' | 'bank_proof' | null;
  bank_details?: Record<string, unknown> | null;
  merchant_credentials?: Record<string, unknown> | null;
  ui_brand?: string | null;
}

function validateGatewayKey(key: string): void {
  if (!/^[a-z][a-z0-9_]{1,62}$/.test(key)) {
    throw new AppError(
      400,
      'gateway_key must start with a letter and contain only lowercase letters, numbers, and underscores (2–63 chars).'
    );
  }
}

export async function createOption(body: CreatePaymentOptionBody): Promise<PaymentOptionAdmin> {
  validateGatewayKey(body.gateway_key);
  if (body.kind === 'merchant') {
    if (body.gateway_key !== 'bkash') {
      throw new AppError(400, 'Merchant integration currently supports gateway_key "bkash" only.');
    }
    const n = await repo.countByKind('merchant');
    if (n > 0) throw new AppError(400, 'A bKash merchant option already exists. Edit the existing one.');
    if (body.manual_flow != null) throw new AppError(400, 'manual_flow must be null for merchant options.');
  } else {
    if (!body.manual_flow) throw new AppError(400, 'manual_flow is required for manual options (mfs_reference or bank_proof).');
    if (body.manual_flow === 'bank_proof' && !body.bank_details) {
      throw new AppError(400, 'bank_details are required for bank transfer (bank_proof) methods.');
    }
    if (body.manual_flow === 'mfs_reference' && !body.bank_details) {
      throw new AppError(400, 'bank_details (pay-to instructions) are required for wallet manual methods.');
    }
  }
  const dup = await repo.countByGatewayKey(body.gateway_key);
  if (dup > 0) throw new AppError(409, 'This gateway_key is already in use.');

  const id = await repo.createRow({
    kind: body.kind,
    gateway_key: body.gateway_key,
    name: body.name.trim(),
    description: body.description ?? null,
    is_enabled: body.is_enabled,
    sort_order: body.sort_order,
    manual_flow: body.manual_flow ?? null,
    bank_details: body.bank_details ?? null,
    merchant_credentials: body.merchant_credentials ?? null,
    ui_brand: body.ui_brand ?? 'generic',
  });
  const row = await repo.findById(id);
  if (!row) throw new AppError(500, 'Failed to load created payment option');
  const pub = rowToPublic(row);
  return {
    ...pub,
    payment_option_id: row.id,
    is_enabled: row.is_enabled === 1,
    sort_order: row.sort_order,
    merchant_credentials_masked: maskMerchantCredentials(row),
  };
}

function mergeCredentialPatch(
  existing: Record<string, unknown> | null | undefined,
  patch: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!patch) return existing ?? null;
  const out: Record<string, unknown> = { ...(existing ?? {}) };
  const secretKeys = ['password', 'app_secret'];
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    if (secretKeys.includes(k) && (v === '' || v === '__unchanged__')) continue;
    out[k] = v;
  }
  return Object.keys(out).length ? out : null;
}

export async function updateOption(
  id: number,
  patch: {
    name?: string;
    description?: string | null;
    is_enabled?: boolean;
    sort_order?: number;
    manual_flow?: 'mfs_reference' | 'bank_proof' | null;
    bank_details?: Record<string, unknown> | null;
    merchant_credentials?: Record<string, unknown> | null;
    ui_brand?: string | null;
  }
): Promise<PaymentOptionAdmin> {
  const row = await repo.findById(id);
  if (!row) throw new AppError(404, 'Payment option not found');

  let mergedCred: Record<string, unknown> | null | undefined;
  if (patch.merchant_credentials !== undefined) {
    mergedCred = mergeCredentialPatch(row.merchant_credentials ?? null, patch.merchant_credentials);
  }

  const ok = await repo.updateById(id, {
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.description !== undefined ? { description: patch.description } : {}),
    ...(patch.is_enabled !== undefined ? { is_enabled: patch.is_enabled } : {}),
    ...(patch.sort_order !== undefined ? { sort_order: patch.sort_order } : {}),
    ...(patch.manual_flow !== undefined ? { manual_flow: patch.manual_flow } : {}),
    ...(patch.bank_details !== undefined ? { bank_details: patch.bank_details } : {}),
    ...(mergedCred !== undefined ? { merchant_credentials: mergedCred } : {}),
    ...(patch.ui_brand !== undefined ? { ui_brand: patch.ui_brand } : {}),
  });
  if (!ok && Object.keys(patch).length > 0) {
    /* noop update */
  }
  const updated = await repo.findById(id);
  if (!updated) throw new AppError(500, 'Failed to load payment option');
  const pub = rowToPublic(updated);
  return {
    ...pub,
    payment_option_id: updated.id,
    is_enabled: updated.is_enabled === 1,
    sort_order: updated.sort_order,
    merchant_credentials_masked: maskMerchantCredentials(updated),
  };
}

export async function removeOption(id: number): Promise<void> {
  const row = await repo.findById(id);
  if (!row) throw new AppError(404, 'Payment option not found');
  await repo.deleteById(id);
}
