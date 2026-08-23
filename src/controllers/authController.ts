import { Request, Response } from 'express';
import { env } from '../config';
import { sendSuccess, sendError } from '../utils/apiResponse';
import * as authService from '../services/authService';
import { setAuthCookies, clearAuthCookies } from '../utils/cookieHelpers';

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
  const { identifier, password, name } = req.body;
  const verificationBaseUrl = pickVerificationBaseUrl(req);
  const result = await authService.register(
    identifier,
    password,
    name ?? '',
    verificationBaseUrl
  );
  return sendSuccess(res, result, 201, result.message);
}

export async function login(req: Request, res: Response): Promise<Response> {
  const { identifier, password } = req.body;
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket?.remoteAddress ?? null;
  const userAgent = req.headers['user-agent'] ?? null;
  const result = await authService.login(identifier, password, ip, userAgent);
  if (result.accessToken) {
    setAuthCookies(res, result.accessToken, result.refreshToken);
  }
  return sendSuccess(res, result);
}

export async function logout(req: Request, res: Response): Promise<Response> {
  const sessionId = req.user?.sessionId;
  const role = req.user?.role ?? 'user';
  if (sessionId) {
    try {
      await authService.logout(sessionId, role);
    } catch {}
  }
  clearAuthCookies(res);
  return sendSuccess(res, { message: 'Logged out successfully' });
}

export async function refresh(req: Request, res: Response): Promise<Response> {
  const refreshToken = req.body?.refreshToken || req.cookies?.refresh_token;
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket?.remoteAddress ?? null;
  const userAgent = req.headers['user-agent'] ?? null;
  const result = await authService.refresh(refreshToken, ip, userAgent);
  if (result.accessToken) {
    setAuthCookies(res, result.accessToken, result.refreshToken);
  }
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
  const { name, mobile, address } = req.body as {
    name: string;
    mobile: string;
    address: string;
  };
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket?.remoteAddress ?? null;
  const userAgent = req.headers['user-agent'] ?? null;
  const result = await authService.guestCheckout(name, mobile, address, ip, userAgent);
  if (result.accessToken) {
    setAuthCookies(res, result.accessToken, result.refreshToken);
  }
  return sendSuccess(res, result, 201, 'Guest account ready');
}

export async function changePassword(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  await authService.changePassword(req.user.id, req.user.role, req.body.current_password, req.body.new_password);
  if (req.user.sessionId) await authService.logout(req.user.sessionId, req.user.role);
  clearAuthCookies(res);
  return sendSuccess(res, { message: 'Password changed. Please sign in again.' });
}

export async function guestAccountStatus(req: Request, res: Response): Promise<Response> {
  const exists = await authService.hasAccountForMobile(req.body.mobile);
  return sendSuccess(res, { exists });
}

export async function continueCheckout(req: Request, res: Response): Promise<Response> {
  const { mobile } = req.body as { mobile: string };
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket?.remoteAddress ?? null;
  const userAgent = req.headers['user-agent'] ?? null;
  const result = await authService.continueCheckout(mobile, ip, userAgent);
  if (result.accessToken) {
    setAuthCookies(res, result.accessToken, result.refreshToken);
  }
  return sendSuccess(res, result, 200, 'Signed in to continue checkout');
}
