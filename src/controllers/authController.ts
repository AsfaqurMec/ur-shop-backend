import { Request, Response } from 'express';
import { env } from '../config';
import { sendSuccess, sendError } from '../utils/apiResponse';
import * as authService from '../services/authService';

function pickVerificationBaseUrl(req: Request): string | undefined {
  const fromBody = typeof req.body?.verificationBaseUrl === 'string' ? req.body.verificationBaseUrl.trim() : '';
  const fromQuery =
    typeof req.query?.verificationBaseUrl === 'string' ? req.query.verificationBaseUrl.trim() : '';
  if (fromBody) return fromBody.replace(/\/$/, '');
  if (fromQuery) return fromQuery.replace(/\/$/, '');
  if (env.frontendUrl) return `${env.frontendUrl}/verify-email`;
  return undefined;
}

function pickResetBaseUrl(req: Request): string | undefined {
  const fromBody = typeof req.body?.resetBaseUrl === 'string' ? req.body.resetBaseUrl.trim() : '';
  const fromQuery = typeof req.query?.resetBaseUrl === 'string' ? req.query.resetBaseUrl.trim() : '';
  if (fromBody) return fromBody.replace(/\/$/, '');
  if (fromQuery) return fromQuery.replace(/\/$/, '');
  if (env.frontendUrl) return `${env.frontendUrl}/reset-password`;
  return undefined;
}

export async function register(req: Request, res: Response): Promise<Response> {
  const { email, password, name } = req.body;
  const verificationBaseUrl = pickVerificationBaseUrl(req);
  const result = await authService.register(
    email,
    password,
    name ?? '',
    verificationBaseUrl
  );
  return sendSuccess(res, result, 201, result.message);
}

export async function login(req: Request, res: Response): Promise<Response> {
  const { email, password } = req.body;
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket?.remoteAddress ?? null;
  const userAgent = req.headers['user-agent'] ?? null;
  const result = await authService.login(email, password, ip, userAgent);
  return sendSuccess(res, result);
}

export async function logout(req: Request, res: Response): Promise<Response> {
  const sessionId = req.user?.sessionId;
  const role = req.user?.role ?? 'user';
  if (sessionId) {
    await authService.logout(sessionId, role);
  }
  return sendSuccess(res, { message: 'Logged out successfully' });
}

export async function refresh(req: Request, res: Response): Promise<Response> {
  const { refreshToken } = req.body;
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket?.remoteAddress ?? null;
  const userAgent = req.headers['user-agent'] ?? null;
  const result = await authService.refresh(refreshToken, ip, userAgent);
  return sendSuccess(res, result);
}

export async function verifyEmail(req: Request, res: Response): Promise<Response> {
  const raw = req.body.token ?? req.query.token;
  const token = (typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '').trim();
  const result = await authService.verifyEmail(token);
  return sendSuccess(res, result, 200, 'Email verified successfully');
}

export async function forgotPassword(req: Request, res: Response): Promise<Response> {
  const { email } = req.body;
  const resetBaseUrl = pickResetBaseUrl(req);
  const result = await authService.forgotPassword(email, resetBaseUrl);
  return sendSuccess(res, result, 200, result.message);
}

export async function resetPassword(req: Request, res: Response): Promise<Response> {
  const { token, password } = req.body;
  const result = await authService.resetPassword(token, password);
  return sendSuccess(res, result, 200, result.message);
}

export async function getProfile(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const user = await authService.getProfile(req.user.id, req.user.role);
  return sendSuccess(res, { user });
}

export async function updateProfile(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const { name, mobile, address } = req.body as {
    name: string;
    mobile?: string | null;
    address?: string | null;
  };
  const user = await authService.updateUserProfile(req.user.id, req.user.role, {
    name,
    mobile,
    address,
  });
  return sendSuccess(res, { user }, 200, 'Profile updated');
}

export async function guestCheckout(req: Request, res: Response): Promise<Response> {
  const { name, email, mobile, address } = req.body as {
    name: string;
    email: string;
    mobile: string;
    address: string;
  };
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket?.remoteAddress ?? null;
  const userAgent = req.headers['user-agent'] ?? null;
  const result = await authService.guestCheckout(name, email, mobile, address, ip, userAgent);
  return sendSuccess(res, result, 201, 'Guest account ready');
}
