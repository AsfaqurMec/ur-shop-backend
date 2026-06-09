import { Request, Response, NextFunction } from 'express';
type RequestHandlerReturn = void | Response | Promise<void | Response>;
type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => RequestHandlerReturn;
/**
 * Wraps async route handlers so thrown errors are passed to the centralized error middleware.
 */
export declare function asyncHandler(fn: AsyncRequestHandler): (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=asyncHandler.d.ts.map