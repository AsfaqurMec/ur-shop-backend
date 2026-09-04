import { Response } from 'express';
import { env } from '../config';

export function getCookieOptions(maxAgeMs?: number) {
  const isProd = env.nodeEnv === 'production';
  const customSameSite = process.env.COOKIE_SAMESITE as 'none' | 'lax' | 'strict' | undefined;
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (customSameSite || (isProd ? 'lax' : 'lax')) as 'none' | 'lax' | 'strict',
    path: '/',
    ...(maxAgeMs != null ? { maxAge: maxAgeMs } : {}),
  };
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken?: string): void {
  // Short-lived access token cookie (15 minutes)
  const accessMaxAgeMs = 15 * 60 * 1000;
  res.cookie('auth_token', accessToken, getCookieOptions(accessMaxAgeMs));

  // Long-lived refresh token cookie (default 7 days)
  if (refreshToken) {
    const expiryDays = env.jwt.sessionExpiryDays || 7;
    const refreshMaxAgeMs = expiryDays * 24 * 60 * 60 * 1000;
    res.cookie('refresh_token', refreshToken, getCookieOptions(refreshMaxAgeMs));
  }
}

export function clearAuthCookies(res: Response): void {
  const clearOptions = {
    ...getCookieOptions(0),
    expires: new Date(0),
  };

  res.cookie('auth_token', '', clearOptions);
  res.cookie('refresh_token', '', clearOptions);
  res.clearCookie('auth_token', clearOptions);
  res.clearCookie('refresh_token', clearOptions);
}
