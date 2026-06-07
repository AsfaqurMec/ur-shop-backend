import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse';
import * as downloadService from '../services/downloadService';

export async function listDownloadables(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const items = await downloadService.listDownloadables(req.user.id);
  return sendSuccess(res, { items });
}

export async function createDownloadToken(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const entitlementId = req.body.entitlement_id as number;
  const result = await downloadService.createDownloadToken(req.user.id, entitlementId);
  return sendSuccess(res, result, 200, 'Download link generated');
}

/** Token-based download (no auth middleware). Token is validated in service. */
export async function downloadFile(req: Request, res: Response): Promise<void> {
  const token = (req.query.token as string)?.trim() ?? '';
  const ip = (req.ip || req.socket?.remoteAddress) ?? null;
  const userAgent = req.get('user-agent') ?? null;
  await downloadService.validateTokenAndStream(token, res, ip, userAgent);
}
