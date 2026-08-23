import { Response } from 'express';
import { env } from '../config';

export function getCookieOptions(maxAgeMs?: number) {
  const isProd = env.nodeEnv === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    ...(maxAgeMs != null ? { maxAge: maxAgeMs } : {}),
  };
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken?: string): void {
  const expiryDays = env.jwt.sessionExpiryDays || 15;
  const maxAgeMs = expiryDays * 24 * 60 * 60 * 1000;

  res.cookie('auth_token', accessToken, getCookieOptions(maxAgeMs));

  if (refreshToken) {
    res.cookie('refresh_token', refreshToken, getCookieOptions(maxAgeMs));
  }
}

export function clearAuthCookies(res: Response): void {
  const isProd = env.nodeEnv === 'production';
  const sameSiteMode = (isProd ? 'none' : 'lax') as 'none' | 'lax';

  const clearOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: sameSiteMode,
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  };

  res.cookie('auth_token', '', clearOptions);
  res.cookie('refresh_token', '', clearOptions);
  res.clearCookie('auth_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
}
