import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config';

/**
 * Strips MongoDB query operators ($ and .) from request inputs
 * to prevent NoSQL injection attacks.
 */
export function sanitizeNoSql(req: Request, _res: Response, next: NextFunction): void {
  const sanitize = (obj: any): void => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
}

/**
 * Rate limiter for auth endpoints (login, register, password reset).
 * In development, allows a generous limit so testing is not blocked.
 */
export const authLimiter = rateLimit({
  windowMs: env.rateLimit.authWindowMinutes * 60 * 1000,
  max: env.nodeEnv === 'development' ? Math.max(env.rateLimit.authMax, 200) : env.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: `Too many authentication attempts. Please try again in ${env.rateLimit.authWindowMinutes} minutes.`,
  },
  skip: () => env.nodeEnv === 'test',
});

/**
 * Dedicated rate limiter for token refresh.
 * Separate from authLimiter so background refreshes never starve login/register attempts.
 */
export const refreshLimiter = rateLimit({
  windowMs: env.rateLimit.authWindowMinutes * 60 * 1000,
  max: env.nodeEnv === 'development' ? 500 : Math.max(env.rateLimit.authMax * 5, 100),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many token refresh attempts. Please try again later.',
  },
  skip: () => env.nodeEnv === 'test',
});

/**
 * General API rate limiter.
 * Takes limit amount and window duration from environment variables.
 */
export const apiLimiter = rateLimit({
  windowMs: env.rateLimit.apiWindowMinutes * 60 * 1000,
  max: env.rateLimit.apiMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please slow down.',
  },
  skip: () => env.nodeEnv === 'test',
});

/**
 * Checkout / Order creation rate limiter.
 * Takes limit amount and window duration from environment variables.
 */
export const checkoutLimiter = rateLimit({
  windowMs: env.rateLimit.checkoutWindowMinutes * 60 * 1000,
  max: env.rateLimit.checkoutMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: `Too many checkout attempts. Please try again in ${env.rateLimit.checkoutWindowMinutes} minutes.`,
  },
  skip: () => env.nodeEnv === 'test',
});
