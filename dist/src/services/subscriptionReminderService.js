"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSubscriptionExpiryReminders = sendSubscriptionExpiryReminders;
const config_1 = require("../config");
const subscriptionRepo = __importStar(require("../repositories/subscriptionRepository"));
const emailService = __importStar(require("./emailService"));
function formatPeriodEndUtc(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return iso;
    return (d.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'UTC',
    }) + ' UTC');
}
function buildRenewProductUrl(row) {
    const base = config_1.env.frontendUrl.replace(/\/$/, '');
    const path = `/products/${encodeURIComponent(row.product_slug)}`;
    const q = new URLSearchParams({ renew: '1' });
    if (row.product_variation_id != null && row.product_variation_id >= 1) {
        q.set('variationId', String(row.product_variation_id));
    }
    return base ? `${base}${path}?${q.toString()}` : `${path}?${q.toString()}`;
}
/**
 * Send “expires tomorrow” emails for active subscriptions (UTC calendar rule).
 * Idempotent per subscription via `expiry_reminder_sent_at`.
 */
async function sendSubscriptionExpiryReminders() {
    const rows = await subscriptionRepo.findActiveNeedingExpiryReminderUtc();
    const subscriptionsUrl = config_1.env.frontendUrl
        ? `${config_1.env.frontendUrl.replace(/\/$/, '')}/dashboard/subscriptions`
        : undefined;
    let emails_sent = 0;
    let failed = 0;
    for (const row of rows) {
        const periodEndIso = row.current_period_end.toISOString();
        const renewUrl = buildRenewProductUrl(row);
        const result = await emailService.sendSubscriptionExpiringSoonEmail(row.user_email, {
            productName: row.product_name,
            periodEnd: periodEndIso,
            periodEndFormatted: formatPeriodEndUtc(periodEndIso),
            renewUrl,
            subscriptionsUrl,
        });
        if (result.sent) {
            await subscriptionRepo.markExpiryReminderSent(row.id);
            emails_sent += 1;
        }
        else {
            failed += 1;
            if (config_1.env.nodeEnv !== 'test') {
                console.warn('[Subscription reminder] Email not sent for subscription', row.id, result.error ?? 'unknown');
            }
        }
    }
    return { scanned: rows.length, emails_sent, failed };
}
//# sourceMappingURL=subscriptionReminderService.js.map