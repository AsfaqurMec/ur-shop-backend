import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';

const ADMIN_ROLE = 'admin';

/**
 * Admin middleware: requires req.user (from auth middleware) and role === 'admin'.
 * Must be used after auth middleware.
 */
export function admin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    sendError(res, 'Unauthorized', 401, 'Authentication required');
    return;
  }
  if (req.user.role !== ADMIN_ROLE) {
    sendError(res, 'Forbidden', 403, 'Admin access required');
    return;
  }
  next();
}
