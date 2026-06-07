import app from './app';
import { env } from './src/config';
import { startBkashStaleOrderCleanup } from './src/services/bkashStaleOrderService';
import { getStoreSettings } from './src/services/storeSettingsService';

const port = process.env.PORT || env.port;

const server = app.listen(port, () => {
  console.log(`Server running on port ${port} (${env.nodeEnv})`);
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
