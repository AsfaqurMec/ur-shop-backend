import { Request, Response } from 'express';
import { sendError, sendSuccess } from '../utils/apiResponse';
import * as adminAdminsService from '../services/adminAdminsService';

export async function changePassword(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const { currentPassword, newPassword } = req.body;
  const result = await adminAdminsService.changeAdminPassword(
    req.user.id,
    currentPassword,
    newPassword
  );
  return sendSuccess(res, result, 200, result.message);
}

export async function createAdmin(req: Request, res: Response): Promise<Response> {
  const { email, password, name } = req.body;
  const result = await adminAdminsService.createAdmin(email, password, name ?? '');
  return sendSuccess(res, result, 201, 'Admin account created');
}
