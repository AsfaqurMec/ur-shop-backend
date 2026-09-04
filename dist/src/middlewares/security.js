"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutLimiter = exports.apiLimiter = exports.refreshLimiter = exports.authLimiter = void 0;
exports.sanitizeNoSql = sanitizeNoSql;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("../config");
/**
 * Strips MongoDB query operators ($ and .) from request inputs
 * to prevent NoSQL injection attacks.
 */
function sanitizeNoSql(req, _res, next) {
    const sanitize = (obj) => {
        if (!obj || typeof obj !== 'object')
            return;
        for (const key of Object.keys(obj)) {
            if (key.startsWith('$') || key.includes('.')) {
                delete obj[key];
            }
            else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitize(obj[key]);
            }
        }
    };
    if (req.body)
        sanitize(req.body);
    if (req.query)
        sanitize(req.query);
    if (req.params)
        sanitize(req.params);
    next();
}
/**
 * Rate limiter for auth endpoints (login, register, password reset).
 * In development, allows a generous limit so testing is not blocked.
 */
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.env.rateLimit.authWindowMinutes * 60 * 1000,
    max: config_1.env.nodeEnv === 'development' ? Math.max(config_1.env.rateLimit.authMax, 200) : config_1.env.rateLimit.authMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: `Too many authentication attempts. Please try again in ${config_1.env.rateLimit.authWindowMinutes} minutes.`,
    },
    skip: () => config_1.env.nodeEnv === 'test',
});
/**
 * Dedicated rate limiter for token refresh.
 * Separate from authLimiter so background refreshes never starve login/register attempts.
 */
exports.refreshLimiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.env.rateLimit.authWindowMinutes * 60 * 1000,
    max: config_1.env.nodeEnv === 'development' ? 500 : Math.max(config_1.env.rateLimit.authMax * 5, 100),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many token refresh attempts. Please try again later.',
    },
    skip: () => config_1.env.nodeEnv === 'test',
});
/**
 * General API rate limiter.
 * Takes limit amount and window duration from environment variables.
 */
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.env.rateLimit.apiWindowMinutes * 60 * 1000,
    max: config_1.env.rateLimit.apiMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many requests. Please slow down.',
    },
    skip: () => config_1.env.nodeEnv === 'test',
});
/**
 * Checkout / Order creation rate limiter.
 * Takes limit amount and window duration from environment variables.
 */
exports.checkoutLimiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.env.rateLimit.checkoutWindowMinutes * 60 * 1000,
    max: config_1.env.rateLimit.checkoutMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: `Too many checkout attempts. Please try again in ${config_1.env.rateLimit.checkoutWindowMinutes} minutes.`,
    },
    skip: () => config_1.env.nodeEnv === 'test',
});
//# sourceMappingURL=security.js.map