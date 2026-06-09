import app from './app';
import { env } from './src/config';
import { connectMongo } from './src/database/mongo';
import { startBkashStaleOrderCleanup } from './src/services/bkashStaleOrderService';
import { getStoreSettings } from './src/services/storeSettingsService';

const port = process.env.PORT || env.port;
const KEEP_ALIVE_MS = 10 * 60 * 1000;

/** Ping GET /api/health every 10 min via the public URL so Render free tier stays awake. */
function startRenderKeepAlive(): void {
  const base = (
    process.env.RENDER_EXTERNAL_URL ||
    process.env.CRON_TRIGGER_BASE_URL ||
    process.env.APP_BASE_URL ||
    ''
  ).replace(/\/$/, '');
  if (!base) return;

  const prefix = env.apiPrefix.replace(/\/$/, '') || '/api';
  const url = `${base}${prefix}/health`;

  const ping = () => {
    fetch(url).catch((err) => {
      if (env.nodeEnv !== 'test') console.error('[keep-alive]', err);
    });
  };

  ping();
  setInterval(ping, KEEP_ALIVE_MS);
  console.log(`[keep-alive] GET ${url} every 10 minutes`);
}

const server = app.listen(port, async () => {
  console.log(`Server running on port ${port} (${env.nodeEnv})`);
  await connectMongo();
  startRenderKeepAlive();
  startBkashStaleOrderCleanup();
  getStoreSettings().catch(() => {
    // Keep email rendering resilient with env defaults when DB settings are unavailable.
  });
  if (env.nodeEnv === 'development') {
    const ok = Boolean(env.mail.host && env.mail.user && env.mail.pass);
    // console.log(
    //   ok
    //     ? `[Mail] SMTP configured (host=${env.mail.host}, from=${env.mail.from})`
    //     : '[Mail] SMTP incomplete — set SMTP_HOST, SMTP_USER, SMTP_PASS in backend .env'
    // );
  }
});

export default server;
