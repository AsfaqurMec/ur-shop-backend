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
  type: 'access';
}

export interface RefreshTokenPayload {
  id: number;
  email: string;
  role: string;
  sessionId: number;
  type: 'refresh';
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateAccessToken(
  payload: Omit<AccessTokenPayload, 'role' | 'type'>,
  role: string = ROLE_USER
): string {
  return jwt.sign(
    { ...payload, role, type: 'access' },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiresIn } as jwt.SignOptions
  );
}

export function generateRefreshToken(
  payload: Omit<RefreshTokenPayload, 'role' | 'type'>,
  role: string = ROLE_USER
): string {
  return jwt.sign(
    { ...payload, role, type: 'refresh' },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn } as jwt.SignOptions
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
  if (decoded.type !== 'access') {
    throw new Error('Invalid token type: expected access token');
  }
  return decoded;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.jwt.refreshSecret) as RefreshTokenPayload;
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type: expected refresh token');
  }
  return decoded;
}

export function getRefreshTokenExpiry(): Date {
  const match = env.jwt.refreshExpiresIn.match(/^(\d+)([dm])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // default 7 days
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const ms = unit === 'd' ? value * 24 * 60 * 60 * 1000 : value * 60 * 1000;
  return new Date(Date.now() + ms);
}
