import { Request, Response, NextFunction } from 'express';

type RequestHandlerReturn = void | Response | Promise<void | Response>;
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => RequestHandlerReturn;

/**
 * Wraps async route handlers so thrown errors are passed to the centralized error middleware.
 */
export function asyncHandler(fn: AsyncRequestHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
