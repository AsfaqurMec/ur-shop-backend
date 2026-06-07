import { Request, Response } from 'express';
import { sendSuccess } from '../utils/apiResponse';

export function getHealth(_req: Request, res: Response): Response {
  return sendSuccess(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
