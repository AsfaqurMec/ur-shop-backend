import {
  EmailVerificationModel,
  PasswordResetModel,
  UserModel,
  UserSessionModel,
} from '../database/models';
import { nextId } from '../database/counter';
import type { UserRow, UserSessionRow, EmailVerificationRow, PasswordResetRow } from '../types/auth';

function date(v: unknown): Date {
  return v ? new Date(v as string | number | Date) : new Date();
}

function userRow(doc: any): UserRow {
  return {
    id: Number(doc.id),
    email: String(doc.email),
    password_hash: String(doc.password_hash),
    name: String(doc.name),
    mobile: doc.mobile != null && String(doc.mobile).trim() ? String(doc.mobile).trim() : null,
    address: doc.address != null && String(doc.address).trim() ? String(doc.address).trim() : null,
    needs_password_change: doc.needs_password_change === true,
    email_verified_at: doc.email_verified_at ? date(doc.email_verified_at) : null,
    created_at: date(doc.created_at),
    updated_at: date(doc.updated_at),
    deleted_at: doc.deleted_at ? date(doc.deleted_at) : null,
  };
}

function sessionRow(doc: any): UserSessionRow {
  return {
    id: Number(doc.id),
    user_id: Number(doc.user_id),
    token_hash: String(doc.token_hash),
    ip: doc.ip ?? null,
    user_agent: doc.user_agent ?? null,
    expires_at: date(doc.expires_at),
    created_at: date(doc.created_at),
  };
}

function verificationRow(doc: any): EmailVerificationRow {
  return {
    id: Number(doc.id),
    user_id: Number(doc.user_id),
    email: String(doc.email),
    token: String(doc.token),
    expires_at: date(doc.expires_at),
    verified_at: doc.verified_at ? date(doc.verified_at) : null,
    created_at: date(doc.created_at),
  };
}

function resetRow(doc: any): PasswordResetRow {
  return {
    id: Number(doc.id),
    user_id: Number(doc.user_id),
    token: String(doc.token),
    expires_at: date(doc.expires_at),
    used_at: doc.used_at ? date(doc.used_at) : null,
    created_at: date(doc.created_at),
  };
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const row = await UserModel.findOne({ email: email.trim(), deleted_at: null }).lean();
  return row ? userRow(row) : null;
}

export async function findUserByMobile(mobile: string): Promise<UserRow | null> {
  const row = await UserModel.findOne({ mobile: mobile.trim(), deleted_at: null }).lean();
  return row ? userRow(row) : null;
}

export async function findUserById(id: number): Promise<UserRow | null> {
  //console.log(id);
  
  const row = await UserModel.findOne({ id, deleted_at: null }).lean();
 // console.log(row);
  
  return row ? userRow(row) : null;
}

export async function createUser(
  email: string,
  passwordHash: string,
  name: string,
  contact?: { mobile?: string | null; address?: string | null; needsPasswordChange?: boolean }
): Promise<number> {
  const id = await nextId('users');
  await UserModel.create({
    id,
    email: email.trim(),
    password_hash: passwordHash,
    name,
    mobile: contact?.mobile?.trim() || null,
    address: contact?.address?.trim() || null,
    email_verified_at: null,
    needs_password_change: contact?.needsPasswordChange === true,
    deleted_at: null,
  });
  return id;
}

export async function updateUserEmailVerified(userId: number): Promise<void> {
  await UserModel.updateOne({ id: userId }, { $set: { email_verified_at: new Date() } });
}

export async function updateUserPassword(userId: number, passwordHash: string): Promise<void> {
  await UserModel.updateOne({ id: userId }, { $set: { password_hash: passwordHash, needs_password_change: false } });
}

export async function emailExistsExcludingUser(email: string, excludeUserId: number): Promise<boolean> {
  return Boolean(await UserModel.exists({ email: email.trim(), id: { $ne: excludeUserId }, deleted_at: null }));
}

export async function updateUserProfile(
  userId: number,
  data: { email: string; name: string; mobile?: string | null; address?: string | null }
): Promise<void> {
  const set: Record<string, unknown> = {
    email: data.email.trim(),
    name: data.name.trim(),
  };
  if (data.mobile !== undefined) set.mobile = data.mobile?.trim() || null;
  if (data.address !== undefined) set.address = data.address?.trim() || null;
  await UserModel.updateOne({ id: userId, deleted_at: null }, { $set: set });
}

export async function updateUserName(userId: number, name: string): Promise<void> {
  await UserModel.updateOne({ id: userId, deleted_at: null }, { $set: { name: name.trim() } });
}

export async function updateUserContact(
  userId: number,
  data: { name?: string; mobile?: string | null; address?: string | null }
): Promise<void> {
  const set: Record<string, unknown> = {};
  if (data.name !== undefined) set.name = data.name.trim();
  if (data.mobile !== undefined) set.mobile = data.mobile?.trim() || null;
  if (data.address !== undefined) set.address = data.address?.trim() || null;
  if (Object.keys(set).length === 0) return;
  await UserModel.updateOne({ id: userId, deleted_at: null }, { $set: set });
}

export async function softDeleteUser(userId: number): Promise<boolean> {
  const result = await UserModel.updateOne({ id: userId, deleted_at: null }, { $set: { deleted_at: new Date() } });
  return result.modifiedCount > 0;
}

export async function createSession(
  userId: number,
  tokenHash: string,
  expiresAt: Date,
  ip: string | null,
  userAgent: string | null
): Promise<number> {
  const id = await nextId('user_sessions');
  await UserSessionModel.create({ id, user_id: userId, token_hash: tokenHash, expires_at: expiresAt, ip, user_agent: userAgent });
  return id;
}

export async function updateSessionTokenHash(sessionId: number, tokenHash: string): Promise<void> {
  await UserSessionModel.updateOne({ id: sessionId }, { $set: { token_hash: tokenHash } });
}

export async function findSessionByTokenHash(tokenHash: string): Promise<UserSessionRow | null> {
  const row = await UserSessionModel.findOne({ token_hash: tokenHash }).lean();
  return row ? sessionRow(row) : null;
}

export async function findSessionById(sessionId: number): Promise<UserSessionRow | null> {
  const row = await UserSessionModel.findOne({ id: sessionId }).lean();
  return row ? sessionRow(row) : null;
}

export async function deleteSessionById(sessionId: number): Promise<void> {
  await UserSessionModel.deleteOne({ id: sessionId });
}

export async function deleteSessionsByUserId(userId: number): Promise<void> {
  await UserSessionModel.deleteMany({ user_id: userId });
}

import { hashToken } from '../utils/tokenHelpers';

export async function createEmailVerification(
  userId: number,
  email: string,
  token: string,
  expiresAt: Date
): Promise<number> {
  const id = await nextId('email_verifications');
  await EmailVerificationModel.create({
    id,
    user_id: userId,
    email,
    token_hash: hashToken(token),
    token, // preserved for backward-compatibility during transition
    expires_at: expiresAt,
    verified_at: null,
  });
  return id;
}

export async function findEmailVerificationByToken(token: string): Promise<EmailVerificationRow | null> {
  const tokenTrimmed = token.trim();
  const hashed = hashToken(tokenTrimmed);
  const row = await EmailVerificationModel.findOne({
    $or: [{ token_hash: hashed }, { token: tokenTrimmed }],
  }).lean();
  return row ? verificationRow(row) : null;
}

export async function markEmailVerificationVerified(verificationId: number): Promise<void> {
  await EmailVerificationModel.updateOne({ id: verificationId }, { $set: { verified_at: new Date() } });
}

export async function createPasswordReset(
  userId: number,
  token: string,
  expiresAt: Date
): Promise<number> {
  const id = await nextId('password_resets');
  await PasswordResetModel.create({
    id,
    user_id: userId,
    token_hash: hashToken(token),
    token, // preserved for backward-compatibility during transition
    expires_at: expiresAt,
    used_at: null,
  });
  return id;
}

export async function findPasswordResetByToken(token: string): Promise<PasswordResetRow | null> {
  const tokenTrimmed = token.trim();
  const hashed = hashToken(tokenTrimmed);
  const row = await PasswordResetModel.findOne({
    $or: [{ token_hash: hashed }, { token: tokenTrimmed }],
    used_at: null,
  }).lean();
  return row ? resetRow(row) : null;
}

export async function markPasswordResetUsed(resetId: number): Promise<void> {
  await PasswordResetModel.updateOne({ id: resetId }, { $set: { used_at: new Date() } });
}
