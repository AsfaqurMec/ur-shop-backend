import { Request, Response, NextFunction } from 'express';
/**
 * Admin middleware: requires req.user (from auth middleware) and role === 'admin'.
 * Must be used after auth middleware.
 */
export declare function admin(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=admin.d.ts.map