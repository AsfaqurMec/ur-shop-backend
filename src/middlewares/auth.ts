import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokenHelpers';
import { sendError } from '../utils/apiResponse';

export interface JwtPayload {
  id: number;
  email: string;
  role: string;
  sessionId: number;
  type?: string;
}

function extractToken(req: Request): string | null {
  const cookieToken = req.cookies?.auth_token;
  if (cookieToken && typeof cookieToken === 'string' && cookieToken.trim()) {
    return cookieToken.trim();
  }
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

/**
 * Auth middleware: verifies JWT and attaches user to req.
 * Use on routes that require authentication.
 */
export function auth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (!token) {
    sendError(res, 'Unauthorized', 401, 'No token provided');
    return;
  }

  try {
    const decoded = verifyAccessToken(token);
    req.userId = String(decoded.id);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      sessionId: decoded.sessionId,
    };
    next();
  } catch {
    sendError(res, 'Unauthorized', 401, 'Invalid or expired token');
  }
}

/**
 * Optional auth: attaches user if valid token present, does not reject if missing.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    next();
    return;
  }
  try {
    const decoded = verifyAccessToken(token);
    req.userId = String(decoded.id);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      sessionId: decoded.sessionId,
    };
  } catch {
    // ignore invalid token
  }
  next();
}
