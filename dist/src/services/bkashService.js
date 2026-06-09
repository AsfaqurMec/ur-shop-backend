"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertBkashConfigured = assertBkashConfigured;
exports.formatBdtAmountForCheckout = formatBdtAmountForCheckout;
exports.createCheckoutPayment = createCheckoutPayment;
exports.queryCheckoutPaymentStatus = queryCheckoutPaymentStatus;
exports.executeCheckoutPayment = executeCheckoutPayment;
exports.bkashAmountMatchesOrderTotal = bkashAmountMatchesOrderTotal;
const crypto_1 = __importDefault(require("crypto"));
const errorHandler_1 = require("../middlewares/errorHandler");
/** bKash errors when execute was already called successfully for this paymentID (see developer.bka.sh error codes). */
const EXECUTE_ALREADY_DONE_CODES = new Set(['2117', '2062', '2068', '2119']);
function executeAlreadyCompleted(data) {
    const code = String(data.errorCode ?? '').trim();
    if (EXECUTE_ALREADY_DONE_CODES.has(code))
        return true;
    const msg = `${data.errorMessage ?? ''} ${data.statusMessage ?? ''}`.toLowerCase();
    return (msg.includes('already been completed') ||
        msg.includes('already completed') ||
        msg.includes('already been processed'));
}
const TOKEN_SKEW_MS = 60_000;
const cachedIdToken = new Map();
function cacheKey(cfg) {
    return crypto_1.default
        .createHash('sha256')
        .update(`${cfg.baseUrl}|${cfg.username}|${cfg.appKey}|${cfg.appSecret}|${cfg.agreementId}`)
        .digest('hex');
}
function assertBkashConfigured(cfg) {
    if (!cfg) {
        throw new errorHandler_1.AppError(503, 'bKash payments are not enabled or credentials are incomplete.');
    }
    if (!cfg.username ||
        !cfg.password ||
        !cfg.appKey ||
        !cfg.appSecret ||
        !cfg.agreementId ||
        !cfg.callbackBaseUrl) {
        throw new errorHandler_1.AppError(503, 'bKash is not fully configured. Set credentials in Admin → Payment options or BKASH_* environment variables.');
    }
}
function grantUrl(base) {
    return `${base}/tokenized/checkout/token/grant`;
}
function createUrl(base) {
    return `${base}/tokenized/checkout/create`;
}
function executeUrl(base) {
    return `${base}/tokenized/checkout/execute`;
}
function paymentStatusUrl(base) {
    return `${base}/tokenized/checkout/payment/status`;
}
/** Order totals are stored in BDT; bKash charges the same amount (two decimal places). */
function formatBdtAmountForCheckout(bdtTotal) {
    const rounded = Math.round(bdtTotal * 100) / 100;
    return rounded.toFixed(2);
}
async function fetchGrantToken(cfg) {
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
    const data = (await res.json());
    const token = data.id_token;
    if (!token) {
        const msg = data.errorMessage || data.statusMessage || `bKash grant token failed (HTTP ${res.status})`;
        throw new errorHandler_1.AppError(502, msg);
    }
    const ttlSec = 3600;
    const key = cacheKey(cfg);
    cachedIdToken.set(key, { value: token, expiresAtMs: Date.now() + ttlSec * 1000 - TOKEN_SKEW_MS });
    return token;
}
async function getIdToken(cfg) {
    const key = cacheKey(cfg);
    const hit = cachedIdToken.get(key);
    if (hit && Date.now() < hit.expiresAtMs) {
        return hit.value;
    }
    return fetchGrantToken(cfg);
}
async function createCheckoutPayment(cfg, params) {
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
    const data = (await res.json());
    if (data.statusCode !== '0000' || !data.paymentID || !data.bkashURL) {
        const msg = data.errorMessage || data.statusMessage || `bKash create payment failed (HTTP ${res.status})`;
        throw new errorHandler_1.AppError(502, msg);
    }
    return { paymentID: data.paymentID, bkashURL: data.bkashURL };
}
async function queryCheckoutPaymentStatus(cfg, paymentID) {
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
    const data = (await res.json());
    if (String(data.errorCode ?? '').trim() !== '') {
        const msg = data.errorMessage || data.statusMessage || `bKash payment status failed (HTTP ${res.status})`;
        throw new errorHandler_1.AppError(502, msg);
    }
    if (data.statusCode && data.statusCode !== '0000') {
        const msg = data.errorMessage || data.statusMessage || `bKash payment status failed (HTTP ${res.status})`;
        throw new errorHandler_1.AppError(502, msg);
    }
    const st = data.transactionStatus ?? null;
    return {
        trxID: data.trxID ?? null,
        transactionStatus: st,
        amountBdt: data.amount ?? null,
    };
}
async function executeCheckoutPayment(cfg, paymentID) {
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
    const data = (await res.json());
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
    throw new errorHandler_1.AppError(400, msg);
}
function bkashAmountMatchesOrderTotal(orderTotalBdt, bkashAmountStr) {
    if (bkashAmountStr == null || bkashAmountStr.trim() === '')
        return true;
    const fromBkash = Number.parseFloat(bkashAmountStr);
    if (!Number.isFinite(fromBkash))
        return false;
    const expected = Math.round(orderTotalBdt * 100) / 100;
    return Math.abs(fromBkash - expected) < 0.01;
}
//# sourceMappingURL=bkashService.js.map