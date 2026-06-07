/**
 * HTTP trigger for subscription expiry reminders (same as POST /api/cron/subscription-expiry-reminders).
 * Loads backend .env for CRON_SECRET, PORT, API_PREFIX, optional CRON_TRIGGER_BASE_URL.
 *
 * Usage: node scripts/trigger-subscription-reminders.js
 * npm:    npm run cron:subscription-reminders
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const secret = process.env.CRON_SECRET;
if (!secret) {
  console.error('[cron] CRON_SECRET is missing in .env');
  process.exit(1);
}

const port = process.env.PORT || '5000';
const prefix = (process.env.API_PREFIX || '/api').replace(/\/$/, '') || '/api';
const base = (process.env.CRON_TRIGGER_BASE_URL || `http://127.0.0.1:${port}`).replace(/\/$/, '');
const url = `${base}${prefix}/cron/subscription-expiry-reminders`;

async function main() {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Cron-Secret': secret,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  if (!res.ok) {
    console.error('[cron]', res.status, body);
    process.exit(1);
  }
  console.log('[cron] OK', body);
}

main().catch((err) => {
  console.error('[cron]', err);
  process.exit(1);
});
