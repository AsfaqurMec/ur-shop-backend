import { Request, Response, NextFunction } from 'express';
/**
 * Strips MongoDB query operators ($ and .) from request inputs
 * to prevent NoSQL injection attacks.
 */
export declare function sanitizeNoSql(req: Request, _res: Response, next: NextFunction): void;
/**
 * Rate limiter for auth endpoints (login, register, password reset).
 * In development, allows a generous limit so testing is not blocked.
 */
export declare const authLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Dedicated rate limiter for token refresh.
 * Separate from authLimiter so background refreshes never starve login/register attempts.
 */
export declare const refreshLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * General API rate limiter.
 * Takes limit amount and window duration from environment variables.
 */
export declare const apiLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Checkout / Order creation rate limiter.
 * Takes limit amount and window duration from environment variables.
 */
export declare const checkoutLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=security.d.ts.map