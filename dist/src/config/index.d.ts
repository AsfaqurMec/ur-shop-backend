export declare const env: {
    readonly nodeEnv: string;
    readonly port: number;
    readonly apiPrefix: string;
    readonly db: {
        readonly uri: string;
        readonly database: string;
    };
    readonly jwt: {
        readonly secret: string;
        readonly accessExpiresIn: string;
        readonly refreshExpiresIn: string;
    };
    readonly upload: {
        readonly dir: string;
        readonly maxFileSizeMb: number;
    };
    readonly cloudinary: {
        readonly cloudName: string;
        readonly apiKey: string;
        readonly apiSecret: string;
        readonly productFolder: string;
        readonly proofFolder: string;
        readonly settingsFolder: string;
        readonly bannerFolder: string;
    };
    readonly mail: {
        readonly host: string;
        readonly port: number;
        readonly secure: boolean;
        readonly user: string;
        readonly pass: string;
        /**
         * Visible From header. Placeholder noreply@example.com is replaced with SMTP_USER so
         * cPanel / shared hosts that require envelope-from = auth user still deliver mail.
         */
        readonly from: string;
        /** If true, use SMTP_USER as the sole From (strict relay hosts). */
        readonly forceFromSmtpUser: boolean;
        readonly tlsRejectUnauthorized: boolean;
        /** Comma-separated addresses notified on new orders (optional). ADMIN_EMAIL also works. */
        readonly adminNotificationEmails: string[];
        /**
         * Send welcome email after user registration (default: on).
         * Set MAIL_SEND_WELCOME_EMAIL=false to disable.
         */
        readonly sendWelcomeEmail: boolean;
    };
    readonly store: {
        readonly name: string;
        readonly tagline: string;
        readonly supportEmail: string;
    };
    /**
     * Shared secret for scheduled jobs (e.g. POST /api/cron/subscription-expiry-reminders with header X-Cron-Secret).
     * Leave empty to disable cron routes.
     */
    readonly cronSecret: string;
    /** Public shop URL (no trailing slash). Used in email links. */
    readonly frontendUrl: string;
    /** bKash Tokenized Checkout (optional; set BKASH_ENABLED=true when configured). */
    readonly bkash: {
        readonly enabled: boolean;
        readonly baseUrl: string;
        readonly username: string;
        readonly password: string;
        readonly appKey: string;
        readonly appSecret: string;
        readonly agreementId: string;
        /** Page bKash redirects to (success/failure params appended). Default: FRONTEND_URL/checkout/bkash-callback */
        readonly callbackBaseUrl: string;
        /** Minutes before an unpaid bKash order is cancelled automatically. */
        readonly pendingExpiryMinutes: number;
    };
};
/** Absolute uploads root: UPLOAD_DIR if absolute, else `<backend package.json dir>/UPLOAD_DIR`. */
export declare function getUploadAbsoluteBase(): string;
export declare const isProd: boolean;
//# sourceMappingURL=index.d.ts.map