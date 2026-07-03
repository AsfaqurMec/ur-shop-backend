"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProd = exports.env = void 0;
exports.getUploadAbsoluteBase = getUploadAbsoluteBase;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
/** Load .env from the backend project root (works with ts-node and node dist/, any cwd). */
function loadEnvFile() {
    const candidates = [
        path_1.default.join(__dirname, '..', '..', '.env'),
        path_1.default.join(__dirname, '..', '..', '..', '.env'),
        path_1.default.join(process.cwd(), '.env'),
    ];
    const found = candidates.find((p) => fs_1.default.existsSync(p));
    const envPath = found ?? candidates[candidates.length - 1];
    const result = dotenv_1.default.config({ path: envPath });
    if (result.error && process.env.NODE_ENV !== 'test') {
        console.warn('[Config] dotenv:', result.error.message, '(path:', envPath, ')');
    }
    else if (found && process.env.NODE_ENV === 'development') {
        //  console.log('[Config] Loaded env from', envPath);
    }
}
loadEnvFile();
/**
 * Directory that contains this backend's package.json.
 * Do not use process.cwd() for uploads — hosts often start Node from dist/ or another cwd,
 * which would write files to the wrong folder and make multer see empty file fields if paired with other issues.
 */
function resolveBackendRoot() {
    let dir = path_1.default.resolve(__dirname);
    for (let depth = 0; depth < 20; depth++) {
        if (fs_1.default.existsSync(path_1.default.join(dir, 'package.json')))
            return dir;
        const parent = path_1.default.dirname(dir);
        if (parent === dir)
            break;
        dir = parent;
    }
    return process.cwd();
}
const backendRoot = resolveBackendRoot();
const getEnv = (key, defaultValue) => {
    const value = process.env[key] ?? defaultValue;
    if (value === undefined) {
        throw new Error(`Missing required env: ${key}`);
    }
    return value;
};
const getEnvNumber = (key, defaultValue) => {
    const raw = process.env[key];
    if (raw === undefined || raw === '')
        return defaultValue;
    const n = parseInt(raw, 10);
    if (Number.isNaN(n))
        return defaultValue;
    return n;
};
exports.env = {
    nodeEnv: getEnv('NODE_ENV', 'development'),
    port: getEnvNumber('PORT', 5000),
    apiPrefix: getEnv('API_PREFIX', '/api'),
    db: {
        uri: (process.env.MONGODB_URL || process.env.MONGO_URL || '').trim(),
        database: (process.env.MONGODB_DB || process.env.DB_NAME || 'ur_shop').trim(),
    },
    jwt: {
        secret: getEnv('JWT_SECRET', 'change-me-in-production'),
        accessExpiresIn: getEnv('JWT_ACCESS_EXPIRES_IN', '15m'),
        refreshExpiresIn: getEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
    },
    upload: {
        dir: getEnv('UPLOAD_DIR', 'uploads'),
        maxFileSizeMb: getEnvNumber('MAX_FILE_SIZE_MB', 10),
    },
    cloudinary: {
        cloudName: (process.env.CLOUDINARY_CLOUD_NAME ?? '').trim(),
        apiKey: (process.env.CLOUDINARY_API_KEY ?? '').trim(),
        apiSecret: (process.env.CLOUDINARY_API_SECRET ?? '').trim(),
        productFolder: (process.env.CLOUDINARY_PRODUCT_FOLDER ?? 'ur-shop/products').trim(),
        proofFolder: (process.env.CLOUDINARY_PROOF_FOLDER ?? 'ur-shop/payment-proofs').trim(),
        settingsFolder: (process.env.CLOUDINARY_SETTINGS_FOLDER ?? 'ur-shop/settings').trim(),
        bannerFolder: (process.env.CLOUDINARY_BANNER_FOLDER ?? 'ur-shop/banners').trim(),
        categoryFolder: (process.env.CLOUDINARY_CATEGORY_FOLDER ?? 'ur-shop/categories').trim(),
        categoryBannerFolder: (process.env.CLOUDINARY_CATEGORY_BANNER_FOLDER ?? 'ur-shop/categories/banners').trim(),
    },
    mail: {
        host: getEnv('SMTP_HOST', '').trim(),
        port: getEnvNumber('SMTP_PORT', 587),
        secure: process.env.SMTP_SECURE === 'true' || String(process.env.SMTP_PORT || '').trim() === '465',
        user: getEnv('SMTP_USER', '').trim(),
        pass: getEnv('SMTP_PASS', '').trim(),
        /**
         * Visible From header. Placeholder noreply@example.com is replaced with SMTP_USER so
         * cPanel / shared hosts that require envelope-from = auth user still deliver mail.
         */
        from: (() => {
            const smtpUser = (process.env.SMTP_USER ?? '').trim();
            let from = (process.env.MAIL_FROM ?? '').trim();
            if (!from) {
                return smtpUser ? `Digital Store <${smtpUser}>` : 'noreply@localhost';
            }
            if (smtpUser && /@example\.(com|net|org)\b/i.test(from)) {
                from = from.replace(/noreply@example\.(com|net|org)\b/gi, smtpUser);
            }
            return from;
        })(),
        /** If true, use SMTP_USER as the sole From (strict relay hosts). */
        forceFromSmtpUser: process.env.MAIL_FORCE_SMTP_FROM === 'true',
        tlsRejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
        /** Comma-separated addresses notified on new orders (optional). ADMIN_EMAIL also works. */
        adminNotificationEmails: (process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || '')
            .split(',')
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean),
        /**
         * Send welcome email after user registration (default: on).
         * Set MAIL_SEND_WELCOME_EMAIL=false to disable.
         */
        sendWelcomeEmail: !['false', '0', 'no', 'off'].includes((process.env.MAIL_SEND_WELCOME_EMAIL ?? '').trim().toLowerCase()),
    },
    store: {
        name: process.env.MAIL_APP_NAME?.trim() || process.env.STORE_NAME?.trim() || 'Digital Store',
        tagline: process.env.STORE_TAGLINE?.trim() || 'Digital products, crafted for creators and teams.',
        supportEmail: process.env.SUPPORT_EMAIL?.trim() || process.env.SMTP_USER?.trim() || '',
    },
    /**
     * Shared secret for scheduled jobs (e.g. POST /api/cron/subscription-expiry-reminders with header X-Cron-Secret).
     * Leave empty to disable cron routes.
     */
    cronSecret: (process.env.CRON_SECRET ?? '').trim(),
    /** Public shop URL (no trailing slash). Used in email links. */
    frontendUrl: (process.env.FRONTEND_URL ||
        process.env.FRONTEND_BASE_URL ||
        process.env.PUBLIC_STORE_URL ||
        '')
        .replace(/\/$/, ''),
    /** bKash Tokenized Checkout (optional; set BKASH_ENABLED=true when configured). */
    bkash: {
        enabled: ['true', '1', 'yes'].includes((process.env.BKASH_ENABLED ?? '').trim().toLowerCase()),
        baseUrl: (process.env.BKASH_BASE_URL ?? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta').replace(/\/$/, ''),
        username: (process.env.BKASH_USERNAME ?? '').trim(),
        password: (process.env.BKASH_PASSWORD ?? '').trim(),
        appKey: (process.env.BKASH_APP_KEY ?? '').trim(),
        appSecret: (process.env.BKASH_APP_SECRET ?? '').trim(),
        agreementId: (process.env.BKASH_AGREEMENT_ID ?? '').trim(),
        /** Page bKash redirects to (success/failure params appended). Default: FRONTEND_URL/checkout/bkash-callback */
        callbackBaseUrl: (() => {
            const explicit = (process.env.BKASH_CALLBACK_BASE_URL ?? '').trim().replace(/\/$/, '');
            if (explicit)
                return explicit;
            const fe = (process.env.FRONTEND_URL || process.env.FRONTEND_BASE_URL || '').replace(/\/$/, '');
            return fe ? `${fe}/checkout/bkash-callback` : '';
        })(),
        /** Minutes before an unpaid bKash order is cancelled automatically. */
        pendingExpiryMinutes: (() => {
            const m = parseInt(process.env.BKASH_PENDING_EXPIRY_MINUTES ?? '5', 10);
            return Number.isFinite(m) && m >= 1 && m <= 60 ? m : 5;
        })(),
    },
};
/** Absolute uploads root: UPLOAD_DIR if absolute, else `<backend package.json dir>/UPLOAD_DIR`. */
function getUploadAbsoluteBase() {
    const d = exports.env.upload.dir.trim() || 'uploads';
    return path_1.default.isAbsolute(d) ? path_1.default.normalize(d) : path_1.default.join(backendRoot, d);
}
exports.isProd = exports.env.nodeEnv === 'production';
//# sourceMappingURL=index.js.map