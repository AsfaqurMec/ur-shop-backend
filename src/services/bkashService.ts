import crypto from 'crypto';
import { AppError } from '../middlewares/errorHandler';
import type { MergedBkashConfig } from './paymentOptionService';

type GrantTokenResponse = {
  id_token?: string;
  statusCode?: string;
  statusMessage?: string;
  errorMessage?: string;
};

type CreatePaymentResponse = {
  statusCode?: string;
  statusMessage?: string;
  paymentID?: string;
  bkashURL?: string;
  errorCode?: string;
  errorMessage?: string;
};

type ExecutePaymentResponse = {
  statusCode?: string;
  statusMessage?: string;
  transactionStatus?: string;
  trxID?: string;
  paymentID?: string;
  amount?: string;
  errorCode?: string;
  errorMessage?: string;
};

type PaymentStatusResponse = {
  statusCode?: string;
  statusMessage?: string;
  transactionStatus?: string;
  trxID?: string;
  paymentID?: string;
  paymentId?: string;
  amount?: string;
  errorCode?: string;
  errorMessage?: string;
};

/** bKash errors when execute was already called successfully for this paymentID (see developer.bka.sh error codes). */
const EXECUTE_ALREADY_DONE_CODES = new Set(['2117', '2062', '2068', '2119']);

function executeAlreadyCompleted(data: ExecutePaymentResponse): boolean {
  const code = String(data.errorCode ?? '').trim();
  if (EXECUTE_ALREADY_DONE_CODES.has(code)) return true;
  const msg = `${data.errorMessage ?? ''} ${data.statusMessage ?? ''}`.toLowerCase();
  return (
    msg.includes('already been completed') ||
    msg.includes('already completed') ||
    msg.includes('already been processed')
  );
}

const TOKEN_SKEW_MS = 60_000;
const cachedIdToken = new Map<string, { value: string; expiresAtMs: number }>();

function cacheKey(cfg: MergedBkashConfig): string {
  return crypto
    .createHash('sha256')
    .update(`${cfg.baseUrl}|${cfg.username}|${cfg.appKey}|${cfg.appSecret}|${cfg.agreementId}`)
    .digest('hex');
}

export function assertBkashConfigured(cfg: MergedBkashConfig | null): asserts cfg is MergedBkashConfig {
  if (!cfg) {
    throw new AppError(503, 'bKash payments are not enabled or credentials are incomplete.');
  }
  if (
    !cfg.username ||
    !cfg.password ||
    !cfg.appKey ||
    !cfg.appSecret ||
    !cfg.agreementId ||
    !cfg.callbackBaseUrl
  ) {
    throw new AppError(
      503,
      'bKash is not fully configured. Set credentials in Admin → Payment options or BKASH_* environment variables.'
    );
  }
}

function grantUrl(base: string): string {
  return `${base}/tokenized/checkout/token/grant`;
}

function createUrl(base: string): string {
  return `${base}/tokenized/checkout/create`;
}

function executeUrl(base: string): string {
  return `${base}/tokenized/checkout/execute`;
}

function paymentStatusUrl(base: string): string {
  return `${base}/tokenized/checkout/payment/status`;
}

/** Order totals are stored in BDT; bKash charges the same amount (two decimal places). */
export function formatBdtAmountForCheckout(bdtTotal: number): string {
  const rounded = Math.round(bdtTotal * 100) / 100;
  return rounded.toFixed(2);
}

async function fetchGrantToken(cfg: MergedBkashConfig): Promise<string> {
  assertBkashConfigured(cfg);
  const res = await fetch(grantUrl(cfg.baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      username: cfg.username,
      password: cfg.password,
    },
    body: JSON.stringify({ app_key: cfg.appKey, app_secret: cfg.appSecret }),
  });
  const data = (await res.json()) as GrantTokenResponse;
  const token = data.id_token;
  if (!token) {
    const msg = data.errorMessage || data.statusMessage || `bKash grant token failed (HTTP ${res.status})`;
    throw new AppError(502, msg);
  }
  const ttlSec = 3600;
  const key = cacheKey(cfg);
  cachedIdToken.set(key, { value: token, expiresAtMs: Date.now() + ttlSec * 1000 - TOKEN_SKEW_MS });
  return token;
}

async function getIdToken(cfg: MergedBkashConfig): Promise<string> {
  const key = cacheKey(cfg);
  const hit = cachedIdToken.get(key);
  if (hit && Date.now() < hit.expiresAtMs) {
    return hit.value;
  }
  return fetchGrantToken(cfg);
}

export async function createCheckoutPayment(
  cfg: MergedBkashConfig,
  params: {
    merchantInvoiceNumber: string;
    payerReference: string;
    amountBdt: string;
  }
): Promise<{ paymentID: string; bkashURL: string }> {
  assertBkashConfigured(cfg);
  const token = await getIdToken(cfg);
  const body = {
    agreementID: cfg.agreementId,
    mode: '0001',
    payerReference: params.payerReference.slice(0, 255).replace(/[<&>]/g, '') || 'customer',
    callbackURL: cfg.callbackBaseUrl,
    amount: params.amountBdt,
    currency: 'BDT',
    intent: 'sale',
    merchantInvoiceNumber: params.merchantInvoiceNumber.slice(0, 255).replace(/[<&>]/g, ''),
  };
  const res = await fetch(createUrl(cfg.baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: token,
      'X-App-Key': cfg.appKey,
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as CreatePaymentResponse;
  if (data.statusCode !== '0000' || !data.paymentID || !data.bkashURL) {
    const msg = data.errorMessage || data.statusMessage || `bKash create payment failed (HTTP ${res.status})`;
    throw new AppError(502, msg);
  }
  return { paymentID: data.paymentID, bkashURL: data.bkashURL };
}

export async function queryCheckoutPaymentStatus(
  cfg: MergedBkashConfig,
  paymentID: string
): Promise<{
  trxID: string | null;
  transactionStatus: string | null;
  amountBdt: string | null;
}> {
  assertBkashConfigured(cfg);
  const token = await getIdToken(cfg);
  const res = await fetch(paymentStatusUrl(cfg.baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: token,
      'X-App-Key': cfg.appKey,
    },
    body: JSON.stringify({ paymentID }),
  });
  const data = (await res.json()) as PaymentStatusResponse;
  if (String(data.errorCode ?? '').trim() !== '') {
    const msg = data.errorMessage || data.statusMessage || `bKash payment status failed (HTTP ${res.status})`;
    throw new AppError(502, msg);
  }
  if (data.statusCode && data.statusCode !== '0000') {
    const msg = data.errorMessage || data.statusMessage || `bKash payment status failed (HTTP ${res.status})`;
    throw new AppError(502, msg);
  }
  const st = data.transactionStatus ?? null;
  return {
    trxID: data.trxID ?? null,
    transactionStatus: st,
    amountBdt: data.amount ?? null,
  };
}

export async function executeCheckoutPayment(
  cfg: MergedBkashConfig,
  paymentID: string
): Promise<{
  trxID: string | null;
  amountBdt: string | null;
}> {
  assertBkashConfigured(cfg);
  const token = await getIdToken(cfg);
  const res = await fetch(executeUrl(cfg.baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: token,
      'X-App-Key': cfg.appKey,
    },
    body: JSON.stringify({ paymentID }),
  });
  const data = (await res.json()) as ExecutePaymentResponse;
  if (data.statusCode === '0000' && data.transactionStatus === 'Completed') {
    return { trxID: data.trxID ?? null, amountBdt: data.amount ?? null };
  }
  if (executeAlreadyCompleted(data)) {
    const queried = await queryCheckoutPaymentStatus(cfg, paymentID);
    if (queried.transactionStatus === 'Completed') {
      return { trxID: queried.trxID, amountBdt: queried.amountBdt };
    }
  }
  const msg = data.errorMessage || data.statusMessage || `bKash execute failed (HTTP ${res.status})`;
  throw new AppError(400, msg);
}

export function bkashAmountMatchesOrderTotal(orderTotalBdt: number, bkashAmountStr: string | null): boolean {
  if (bkashAmountStr == null || bkashAmountStr.trim() === '') return true;
  const fromBkash = Number.parseFloat(bkashAmountStr);
  if (!Number.isFinite(fromBkash)) return false;
  const expected = Math.round(orderTotalBdt * 100) / 100;
  return Math.abs(fromBkash - expected) < 0.01;
}
