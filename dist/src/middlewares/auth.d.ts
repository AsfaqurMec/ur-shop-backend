import { Request, Response, NextFunction } from 'express';
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
export declare function auth(req: Request, res: Response, next: NextFunction): void;
/**
 * Optional auth: attaches user if valid token present, does not reject if missing.
 */
export declare function optionalAuth(req: Request, _res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map