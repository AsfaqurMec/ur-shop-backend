import { env } from '../config';
import * as subscriptionRepo from '../repositories/subscriptionRepository';
import * as emailService from './emailService';

function formatPeriodEndUtc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return (
    d.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    }) + ' UTC'
  );
}

function buildRenewProductUrl(row: subscriptionRepo.SubscriptionExpiryReminderRow): string {
  const base = env.frontendUrl.replace(/\/$/, '');
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
export async function sendSubscriptionExpiryReminders(): Promise<{
  scanned: number;
  emails_sent: number;
  failed: number;
}> {
  const rows = await subscriptionRepo.findActiveNeedingExpiryReminderUtc();
  const subscriptionsUrl = env.frontendUrl
    ? `${env.frontendUrl.replace(/\/$/, '')}/dashboard/subscriptions`
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
    } else {
      failed += 1;
      if (env.nodeEnv !== 'test') {
        console.warn(
          '[Subscription reminder] Email not sent for subscription',
          row.id,
          result.error ?? 'unknown'
        );
      }
    }
  }

  return { scanned: rows.length, emails_sent, failed };
}
