import { Response } from 'express';

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message?: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, message?: string): Response {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(message && { message }),
  });
}

export function sendError(res: Response, error: string, statusCode = 500, message?: string): Response {
  return res.status(statusCode).json({
    success: false,
    error,
    ...(message && { message }),
  });
}
