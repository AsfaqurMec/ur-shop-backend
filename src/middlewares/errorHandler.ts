import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { sendError } from '../utils/apiResponse';
import { env } from '../config';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    this.name = 'AppError';
  }
}

function getMessageForError(err: Error): string {
  const code = (err as NodeJS.ErrnoException).code;
  if (code === 'ECONNREFUSED') {
    return 'Database unavailable. Start MySQL (see docs/LOCAL-DATABASE.md).';
  }
  if (code === 'ER_ACCESS_DENIED_ERROR' || code === 'ER_DBACCESS_DENIED_ERROR') {
    return 'Database connection denied. Check DB_USER and DB_PASSWORD in .env.';
  }
  if (code === 'ER_BAD_DB_ERROR') {
    return 'Database does not exist. Run: npm run db:setup';
  }
  return 'Internal server error';
}

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof multer.MulterError) {
    const msg =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File is too large for the configured upload limit.'
        : err.code === 'LIMIT_UNEXPECTED_FILE'
          ? 'Unexpected file field. Use field name "image" or "images" (one file only per product).'
          : err.message;
    sendError(res, msg, 400);
    return;
  }

  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const message = isAppError ? err.message : getMessageForError(err);

  if (!isAppError && env.nodeEnv !== 'test') {
    console.error('[Error]', err);
  }

  sendError(res, message, statusCode);
}
