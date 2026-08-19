import crypto from 'crypto';
import { AppError } from '../middlewares/errorHandler';
import * as authRepo from '../repositories/authRepository';
import * as adminAuthRepo from '../repositories/adminAuthRepository';
import { hashPassword, comparePassword } from '../utils/passwordHelpers';
import {
  hashToken,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
  ROLE_ADMIN,
} from '../utils/tokenHelpers';
import * as emailService from './emailService';
import { env } from '../config';
import type { SafeUser } from '../types/auth';

const VERIFICATION_EXPIRY_HOURS = 24;
const PASSWORD_RESET_EXPIRY_HOURS = 1;

function toSafeUser(row: {
  id: number;
  email: string;
  name: string;
  mobile?: string | null;
  address?: string | null;
  needs_password_change?: boolean;
  email_verified_at: Date | null;
  created_at: Date;
  updated_at: Date;
}): SafeUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    mobile: row.mobile?.trim() || null,
    address: row.address?.trim() || null,
    email_verified_at: row.email_verified_at ? row.email_verified_at.toISOString() : null,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    role: 'user',
    needs_password_change: row.needs_password_change === true,
  };
}

function toSafeAdmin(row: {
  id: number;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}): SafeUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    mobile: null,
    address: null,
    email_verified_at: null,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    role: 'admin',
    needs_password_change: false,
  };
}

function randomToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function register(
  identifier: string,
  password: string,
  name: string,
  verificationBaseUrl?: string
): Promise<{ user: SafeUser; message: string }> {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const isEmail = normalizedIdentifier.includes('@');
  const mobile = isEmail ? null : normalizedIdentifier;
  const email = isEmail ? normalizedIdentifier : `${mobile}@guest.local`;
  const existing = isEmail ? await authRepo.findUserByEmail(email) : await authRepo.findUserByMobile(mobile!);
  if (existing) {
    throw new AppError(409, 'Email already registered');
  }
  const passwordHash = await hashPassword(password);
  const userId = await authRepo.createUser(email, passwordHash, name.trim() || identifier, { mobile });
  const user = await authRepo.findUserById(userId);
  if (!user) throw new AppError(500, 'Failed to create user');

  const token = randomToken();
  const expiresAt = new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);
  if (isEmail) await authRepo.createEmailVerification(userId, email, token, expiresAt);

  if (isEmail && verificationBaseUrl) {
    const verifyUrl = `${verificationBaseUrl.replace(/\/$/, '')}?token=${token}`;
    await emailService.sendVerifyEmail(email, { verifyUrl });
  }

  if (isEmail && env.mail.sendWelcomeEmail) {
    const base = env.frontendUrl.replace(/\/$/, '');
    const loginUrl = base ? `${base}/login` : undefined;
    const shopUrl = base ? `${base}/shop` : undefined;
    await emailService.sendWelcomeEmail(email, {
      name: user.name,
      email: user.email,
      loginUrl,
      shopUrl,
    });
  }

  return {
    user: toSafeUser(user),
    message: isEmail && verificationBaseUrl
      ? 'Registration successful. Please check your email to verify your account.'
      : 'Registration successful. You can now sign in.',
  };
}

export async function login(
  identifier: string,
  password: string,
  ip: string | null,
  userAgent: string | null
): Promise<{
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}> {
  const normalizedIdentifier = identifier.trim();
  const user = normalizedIdentifier.includes('@')
    ? await authRepo.findUserByEmail(normalizedIdentifier)
    : await authRepo.findUserByMobile(normalizedIdentifier);
  if (user) {
    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      throw new AppError(401, 'Invalid email or password');
    }

    const expiresAt = getRefreshTokenExpiry();
    const placeholderHash = hashToken(crypto.randomBytes(24).toString('hex'));
    const sessionId = await authRepo.createSession(
      user.id,
      placeholderHash,
      expiresAt,
      ip,
      userAgent
    );
    const signedRefreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      sessionId,
    });
    const tokenHash = hashToken(signedRefreshToken);
    await authRepo.updateSessionTokenHash(sessionId, tokenHash);

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      sessionId,
    });

    return {
      user: toSafeUser(user),
      accessToken,
      refreshToken: signedRefreshToken,
      expiresAt: expiresAt.toISOString(),
    };
  }

  const admin = await adminAuthRepo.findAdminByEmail(normalizedIdentifier);
  if (!admin) {
    throw new AppError(401, 'Invalid email or password');
  }
  const adminValid = await comparePassword(password, admin.password_hash);
  if (!adminValid) {
    throw new AppError(401, 'Invalid email or password');
  }

  const adminExpiresAt = getRefreshTokenExpiry();
  const adminPlaceholderHash = hashToken(crypto.randomBytes(24).toString('hex'));
  const adminSessionId = await adminAuthRepo.createAdminSession(
    admin.id,
    adminPlaceholderHash,
    adminExpiresAt,
    ip,
    userAgent
  );
  const adminRefreshToken = generateRefreshToken(
    {
      id: admin.id,
      email: admin.email,
      sessionId: adminSessionId,
    },
    ROLE_ADMIN
  );
  const adminTokenHash = hashToken(adminRefreshToken);
  await adminAuthRepo.updateAdminSessionTokenHash(adminSessionId, adminTokenHash);

  const adminAccessToken = generateAccessToken(
    {
      id: admin.id,
      email: admin.email,
      sessionId: adminSessionId,
    },
    ROLE_ADMIN
  );

  return {
    user: toSafeAdmin(admin),
    accessToken: adminAccessToken,
    refreshToken: adminRefreshToken,
    expiresAt: adminExpiresAt.toISOString(),
  };
}

export async function logout(sessionId: number, role: string): Promise<void> {
  if (role === ROLE_ADMIN) {
    await adminAuthRepo.deleteAdminSessionById(sessionId);
    return;
  }
  await authRepo.deleteSessionById(sessionId);
}

export async function refresh(
  refreshToken: string,
  ip: string | null,
  userAgent: string | null
): Promise<{
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, 'Invalid or expired refresh token');
  }
  const tokenHash = hashToken(refreshToken);

  if (payload.role === ROLE_ADMIN) {
    const session = await adminAuthRepo.findAdminSessionByTokenHash(tokenHash);
    if (!session || new Date() > session.expires_at) {
      throw new AppError(401, 'Session expired or invalid');
    }
    if (session.id !== payload.sessionId) {
      throw new AppError(401, 'Invalid refresh token');
    }
    const admin = await adminAuthRepo.findAdminById(payload.id);
    if (!admin) {
      await adminAuthRepo.deleteAdminSessionById(session.id);
      throw new AppError(401, 'Account no longer exists');
    }

    await adminAuthRepo.deleteAdminSessionById(session.id);
    const expiresAt = getRefreshTokenExpiry();
    const placeholderHash = hashToken(crypto.randomBytes(24).toString('hex'));
    const newSessionId = await adminAuthRepo.createAdminSession(
      admin.id,
      placeholderHash,
      expiresAt,
      ip,
      userAgent
    );
    const signedRefreshToken = generateRefreshToken(
      {
        id: admin.id,
        email: admin.email,
        sessionId: newSessionId,
      },
      ROLE_ADMIN
    );
    const newTokenHash = hashToken(signedRefreshToken);
    await adminAuthRepo.updateAdminSessionTokenHash(newSessionId, newTokenHash);

    const accessToken = generateAccessToken(
      {
        id: admin.id,
        email: admin.email,
        sessionId: newSessionId,
      },
      ROLE_ADMIN
    );

    return {
      user: toSafeAdmin(admin),
      accessToken,
      refreshToken: signedRefreshToken,
      expiresAt: expiresAt.toISOString(),
    };
  }

  const session = await authRepo.findSessionByTokenHash(tokenHash);
  if (!session || new Date() > session.expires_at) {
    throw new AppError(401, 'Session expired or invalid');
  }
  if (session.id !== payload.sessionId) {
    throw new AppError(401, 'Invalid refresh token');
  }
  const user = await authRepo.findUserById(payload.id);
  if (!user) {
    await authRepo.deleteSessionById(session.id);
    throw new AppError(401, 'User no longer exists');
  }

  await authRepo.deleteSessionById(session.id);
  const expiresAt = getRefreshTokenExpiry();
  const newSessionId = await authRepo.createSession(
    user.id,
    '',
    expiresAt,
    ip,
    userAgent
  );
  const signedRefreshToken = generateRefreshToken({
    id: user.id,
    email: user.email,
    sessionId: newSessionId,
  });
  const newTokenHash = hashToken(signedRefreshToken);
  await authRepo.updateSessionTokenHash(newSessionId, newTokenHash);

  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    sessionId: newSessionId,
  });

  return {
    user: toSafeUser(user),
    accessToken,
    refreshToken: signedRefreshToken,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function verifyEmail(token: string): Promise<{ user: SafeUser }> {
  const verification = await authRepo.findEmailVerificationByToken(token.trim());
  if (!verification) {
    throw new AppError(400, 'Invalid or expired verification token');
  }
  // Idempotent: link open twice, React Strict Mode double-fetch, or user clicks Verify again.
  if (verification.verified_at) {
    const user = await authRepo.findUserById(verification.user_id);
    if (!user) throw new AppError(500, 'User not found');
    return { user: toSafeUser(user) };
  }
  if (new Date() > verification.expires_at) {
    throw new AppError(400, 'Verification token has expired');
  }
  await authRepo.markEmailVerificationVerified(verification.id);
  await authRepo.updateUserEmailVerified(verification.user_id);
  const user = await authRepo.findUserById(verification.user_id);
  if (!user) throw new AppError(500, 'User not found');
  return { user: toSafeUser(user) };
}

export async function forgotPassword(email: string, resetBaseUrl?: string): Promise<{ message: string }> {
  const user = await authRepo.findUserByEmail(email);
  if (!user) {
    return { message: 'If an account exists with this email, you will receive a reset link.' };
  }
  const token = randomToken();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000);
  await authRepo.createPasswordReset(user.id, token, expiresAt);

  if (resetBaseUrl) {
    const resetUrl = `${resetBaseUrl.replace(/\/$/, '')}?token=${token}`;
    await emailService.sendPasswordResetEmail(user.email, {
      resetUrl,
      expiresInHours: PASSWORD_RESET_EXPIRY_HOURS,
    });
  }

  return {
    message: 'If an account exists with this email, you will receive a reset link.',
  };
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  const reset = await authRepo.findPasswordResetByToken(token);
  if (!reset) {
    throw new AppError(400, 'Invalid or expired reset token');
  }
  if (new Date() > reset.expires_at) {
    throw new AppError(400, 'Reset token has expired');
  }
  const passwordHash = await hashPassword(newPassword);
  await authRepo.updateUserPassword(reset.user_id, passwordHash);
  await authRepo.markPasswordResetUsed(reset.id);

  const user = await authRepo.findUserById(reset.user_id);
  if (user) {
    const loginUrl = env.frontendUrl ? `${env.frontendUrl}/login` : undefined;
    void emailService
      .sendPasswordChangedEmail(user.email, {
        name: user.name?.trim() || undefined,
        loginUrl,
      })
      .catch((err) => {
        if (env.nodeEnv !== 'test') console.error('[Mail] Password-changed email failed:', err);
      });
  }

  return { message: 'Password has been reset successfully.' };
}

export async function getProfile(userId: number, role: string): Promise<SafeUser> {
  if (role === ROLE_ADMIN) {
    const admin = await adminAuthRepo.findAdminById(userId);
    if (!admin) {
      throw new AppError(404, 'User not found');
    }
    return toSafeAdmin(admin);
  }
  const user = await authRepo.findUserById(userId);
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  return toSafeUser(user);
}

export async function updateProfileName(userId: number, role: string, name: string): Promise<SafeUser> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new AppError(400, 'Name is required');
  }
  if (role === ROLE_ADMIN) {
    const admin = await adminAuthRepo.findAdminById(userId);
    if (!admin) {
      throw new AppError(404, 'User not found');
    }
    await adminAuthRepo.updateAdminName(userId, trimmed);
  } else {
    const user = await authRepo.findUserById(userId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    await authRepo.updateUserName(userId, trimmed);
  }
  return getProfile(userId, role);
}

export async function updateUserProfile(
  userId: number,
  role: string,
  data: { name: string; mobile?: string | null; address?: string | null }
): Promise<SafeUser> {
  const trimmedName = data.name.trim();
  if (!trimmedName) {
    throw new AppError(400, 'Name is required');
  }
  if (role === ROLE_ADMIN) {
    return updateProfileName(userId, role, trimmedName);
  }
  const user = await authRepo.findUserById(userId);
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  const mobile = data.mobile !== undefined ? (data.mobile?.trim() || null) : undefined;
  const address = data.address !== undefined ? (data.address?.trim() || null) : undefined;
  if (mobile !== undefined && !mobile) {
    throw new AppError(400, 'Mobile number is required');
  }
  if (address !== undefined && !address) {
    throw new AppError(400, 'Address is required');
  }
  await authRepo.updateUserContact(userId, {
    name: trimmedName,
    ...(mobile !== undefined ? { mobile } : {}),
    ...(address !== undefined ? { address } : {}),
  });
  return getProfile(userId, role);
}

async function createUserSession(
  user: { id: number; email: string },
  ip: string | null,
  userAgent: string | null
): Promise<{
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}> {
  const fullUser = await authRepo.findUserById(user.id);
  if (!fullUser) throw new AppError(500, 'User not found');

  const expiresAt = getRefreshTokenExpiry();
  const placeholderHash = hashToken(crypto.randomBytes(24).toString('hex'));
  const sessionId = await authRepo.createSession(fullUser.id, placeholderHash, expiresAt, ip, userAgent);
  const signedRefreshToken = generateRefreshToken({
    id: fullUser.id,
    email: fullUser.email,
    sessionId,
  });
  const tokenHash = hashToken(signedRefreshToken);
  await authRepo.updateSessionTokenHash(sessionId, tokenHash);

  const accessToken = generateAccessToken({
    id: fullUser.id,
    email: fullUser.email,
    sessionId,
  });

  return {
    user: toSafeUser(fullUser),
    accessToken,
    refreshToken: signedRefreshToken,
    expiresAt: expiresAt.toISOString(),
  };
}

/** Register or sign in a guest shopper (password = email) and return auth tokens. */
export async function guestCheckout(
  name: string,
  mobile: string,
  address: string,
  ip: string | null,
  userAgent: string | null
): Promise<{
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}> {
  const trimmedMobile = mobile.trim();
  const generatedEmail = `${trimmedMobile}@guest.local`;
  const trimmedName = name.trim() || trimmedMobile;
  const trimmedAddress = address.trim();
  if (!trimmedMobile) throw new AppError(400, 'Mobile number is required');
  if (!trimmedAddress) throw new AppError(400, 'Address is required');

  const existing = await authRepo.findUserByMobile(trimmedMobile);
  if (existing) {
    const valid = await comparePassword(trimmedMobile.slice(0, 5), existing.password_hash);
    if (!valid) {
      throw new AppError(409, 'An account with this email already exists. Please log in to continue.');
    }
    await authRepo.updateUserContact(existing.id, {
      name: trimmedName,
      mobile: trimmedMobile,
      address: trimmedAddress,
    });
    return createUserSession(existing, ip, userAgent);
  }

  const passwordHash = await hashPassword(trimmedMobile.slice(0, 5));
  const userId = await authRepo.createUser(generatedEmail, passwordHash, trimmedName, {
    mobile: trimmedMobile,
    address: trimmedAddress,
    needsPasswordChange: true,
  });
  const user = await authRepo.findUserById(userId);
  if (!user) throw new AppError(500, 'Failed to create user');
  return createUserSession(user, ip, userAgent);
}

export async function changePassword(userId: number, role: string, currentPassword: string, newPassword: string): Promise<void> {
  if (role === ROLE_ADMIN) throw new AppError(403, 'Password changes are not available here');
  const user = await authRepo.findUserById(userId);
  if (!user) throw new AppError(404, 'User not found');
  if (!(await comparePassword(currentPassword, user.password_hash))) throw new AppError(400, 'Current password is incorrect');
  if (currentPassword === newPassword) throw new AppError(400, 'Choose a different new password');
  await authRepo.updateUserPassword(userId, await hashPassword(newPassword));
}

export async function hasAccountForMobile(mobile: string): Promise<boolean> {
  return Boolean(await authRepo.findUserByMobile(mobile.trim()));
}

/** Sign in an existing account by mobile for guest checkout continuation (no password required). */
export async function continueCheckout(
  mobile: string,
  ip: string | null,
  userAgent: string | null
): Promise<{
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}> {
  const trimmedMobile = mobile.trim();
  if (!trimmedMobile) throw new AppError(400, 'Mobile number is required');

  const existing = await authRepo.findUserByMobile(trimmedMobile);
  if (!existing) throw new AppError(404, 'No account found for this mobile number');
  if (!existing.address?.trim()) {
    throw new AppError(400, 'This account has no saved address. Please log in to update your profile.');
  }

  return createUserSession(existing, ip, userAgent);
}
