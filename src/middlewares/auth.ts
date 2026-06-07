import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config';
import { sendError } from '../utils/apiResponse';

export interface JwtPayload {
  id: number;
  email: string;
  role: string;
  sessionId: number;
}

/**
 * Auth middleware: verifies JWT and attaches user to req.
 * Use on routes that require authentication.
 */
export function auth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    sendError(res, 'Unauthorized', 401, 'No token provided');
    return;
  }

  try {
    const decoded = jwt.verify(token, env.jwt.secret) as JwtPayload;
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
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    next();
    return;
  }
  try {
    const decoded = jwt.verify(token, env.jwt.secret) as JwtPayload;
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
