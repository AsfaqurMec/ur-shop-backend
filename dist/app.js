"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const config_1 = require("./src/config");
const middlewares_1 = require("./src/middlewares");
const security_1 = require("./src/middlewares/security");
const routes_1 = __importDefault(require("./src/routes"));
const app = (0, express_1.default)();
// Enable Gzip/Brotli compression for all JSON/text responses
app.use((0, compression_1.default)());
// Trust reverse proxy (Render / Nginx / Cloudflare / Next.js)
app.set('trust proxy', 1);
// Enterprise HTTP security headers
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // CSP handled by Next.js edge / reverse proxy
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
// CORS configuration with credentials enabled
const allowedOrigins = [
    config_1.env.frontendUrl?.replace(/\/$/, ''),
    process.env.APP_BASE_URL?.replace(/\/$/, ''),
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
].filter((x) => Boolean(x));
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. server-side Next.js rewrites / mobile / curl)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        if (config_1.env.nodeEnv !== 'production') {
            if (origin.endsWith('.vercel.app') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
                return callback(null, true);
            }
        }
        return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));
// Parse cookies and request bodies with strict size caps
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Strip MongoDB operators ($ and .) to prevent NoSQL injection
app.use(security_1.sanitizeNoSql);
// Public uploads: product images only (payment proofs & ticket attachments stay private)
const uploadBase = (0, config_1.getUploadAbsoluteBase)();
app.use('/products/images', express_1.default.static(path_1.default.join(uploadBase, 'products', 'images')));
app.use('/settings/logos', express_1.default.static(path_1.default.join(uploadBase, 'settings', 'logos')));
app.use('/reviews/images', express_1.default.static(path_1.default.join(uploadBase, 'reviews', 'images')));
// API routes with rate limiting
app.use(config_1.env.apiPrefix, security_1.apiLimiter, routes_1.default);
app.use(middlewares_1.errorHandler);
app.get('/', (req, res) => {
    res.send('Backend is running 🚀');
});
exports.default = app;
//# sourceMappingURL=app.js.map