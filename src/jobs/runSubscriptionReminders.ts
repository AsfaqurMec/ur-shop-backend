/**
 * Run from backend root after build: node dist/jobs/runSubscriptionReminders.js
 * Or with ts-node-dev: npx ts-node-dev --transpile-only --no-notify src/jobs/runSubscriptionReminders.ts
 *
 * Sends “expires tomorrow” emails (same logic as POST /api/cron/subscription-expiry-reminders).
 * Does not require CRON_SECRET — use for local ops or system cron.
 */

import { sendSubscriptionExpiryReminders } from '../services/subscriptionReminderService';

sendSubscriptionExpiryReminders()
  .then((r) => {
    console.log('[jobs] subscription-expiry-reminders', r);
    process.exit(0);
  })
  .catch((err) => {
    console.error('[jobs] subscription-expiry-reminders failed', err);
    process.exit(1);
  });
