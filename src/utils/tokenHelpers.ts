import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config';

const ROLE_USER = 'user';
export const ROLE_ADMIN = 'admin';

export interface AccessTokenPayload {
  id: number;
  email: string;
  role: string;
  sessionId: number;
}

export interface RefreshTokenPayload {
  id: number;
  email: string;
  role: string;
  sessionId: number;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateAccessToken(
  payload: Omit<AccessTokenPayload, 'role'>,
  role: string = ROLE_USER
): string {
  return jwt.sign(
    { ...payload, role },
    env.jwt.secret,
    { expiresIn: env.jwt.accessExpiresIn } as jwt.SignOptions
  );
}

export function generateRefreshToken(
  payload: Omit<RefreshTokenPayload, 'role'>,
  role: string = ROLE_USER
): string {
  return jwt.sign(
    { ...payload, role },
    env.jwt.secret,
    { expiresIn: env.jwt.refreshExpiresIn } as jwt.SignOptions
  );
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.jwt.secret) as RefreshTokenPayload;
}

export function getRefreshTokenExpiry(): Date {
  const match = env.jwt.refreshExpiresIn.match(/^(\d+)([dm])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // default 7 days
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const ms = unit === 'd' ? value * 24 * 60 * 60 * 1000 : value * 60 * 1000;
  return new Date(Date.now() + ms);
}
