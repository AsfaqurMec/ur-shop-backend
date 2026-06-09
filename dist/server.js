"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = require("./src/config");
const mongo_1 = require("./src/database/mongo");
const bkashStaleOrderService_1 = require("./src/services/bkashStaleOrderService");
const storeSettingsService_1 = require("./src/services/storeSettingsService");
const port = process.env.PORT || config_1.env.port;
const KEEP_ALIVE_MS = 10 * 60 * 1000;
/** Ping GET /api/health every 10 min via the public URL so Render free tier stays awake. */
function startRenderKeepAlive() {
    const base = (process.env.RENDER_EXTERNAL_URL ||
        process.env.CRON_TRIGGER_BASE_URL ||
        process.env.APP_BASE_URL ||
        '').replace(/\/$/, '');
    if (!base)
        return;
    const prefix = config_1.env.apiPrefix.replace(/\/$/, '') || '/api';
    const url = `${base}${prefix}/health`;
    const ping = () => {
        fetch(url).catch((err) => {
            if (config_1.env.nodeEnv !== 'test')
                console.error('[keep-alive]', err);
        });
    };
    ping();
    setInterval(ping, KEEP_ALIVE_MS);
    console.log(`[keep-alive] GET ${url} every 10 minutes`);
}
const server = app_1.default.listen(port, async () => {
    console.log(`Server running on port ${port} (${config_1.env.nodeEnv})`);
    await (0, mongo_1.connectMongo)();
    startRenderKeepAlive();
    (0, bkashStaleOrderService_1.startBkashStaleOrderCleanup)();
    (0, storeSettingsService_1.getStoreSettings)().catch(() => {
        // Keep email rendering resilient with env defaults when DB settings are unavailable.
    });
    if (config_1.env.nodeEnv === 'development') {
        const ok = Boolean(config_1.env.mail.host && config_1.env.mail.user && config_1.env.mail.pass);
        // console.log(
        //   ok
        //     ? `[Mail] SMTP configured (host=${env.mail.host}, from=${env.mail.from})`
        //     : '[Mail] SMTP incomplete — set SMTP_HOST, SMTP_USER, SMTP_PASS in backend .env'
        // );
    }
});
exports.default = server;
//# sourceMappingURL=server.js.map