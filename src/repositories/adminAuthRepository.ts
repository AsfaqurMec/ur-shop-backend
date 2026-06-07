import { AdminModel, AdminSessionModel } from '../database/models';
import { nextId } from '../database/counter';
import type { AdminRow, AdminSessionRow } from '../types/auth';

function date(v: unknown): Date {
  return v ? new Date(v as string | number | Date) : new Date();
}

function adminRow(doc: any): AdminRow {
  return {
    id: Number(doc.id),
    email: String(doc.email),
    password_hash: String(doc.password_hash),
    name: String(doc.name),
    role: String(doc.role ?? 'admin'),
    created_at: date(doc.created_at),
    updated_at: date(doc.updated_at),
    deleted_at: doc.deleted_at ? date(doc.deleted_at) : null,
  };
}

function sessionRow(doc: any): AdminSessionRow {
  return {
    id: Number(doc.id),
    admin_id: Number(doc.admin_id),
    token_hash: String(doc.token_hash),
    ip: doc.ip ?? null,
    user_agent: doc.user_agent ?? null,
    expires_at: date(doc.expires_at),
    created_at: date(doc.created_at),
  };
}

export async function findAdminByEmail(email: string): Promise<AdminRow | null> {
  const row = await AdminModel.findOne({ email: email.trim(), deleted_at: null }).lean();
  return row ? adminRow(row) : null;
}

export async function findAdminById(id: number): Promise<AdminRow | null> {
  const row = await AdminModel.findOne({ id, deleted_at: null }).lean();
  return row ? adminRow(row) : null;
}

export async function createAdminSession(
  adminId: number,
  tokenHash: string,
  expiresAt: Date,
  ip: string | null,
  userAgent: string | null
): Promise<number> {
  const id = await nextId('admin_sessions');
  await AdminSessionModel.create({ id, admin_id: adminId, token_hash: tokenHash, expires_at: expiresAt, ip, user_agent: userAgent });
  return id;
}

export async function updateAdminSessionTokenHash(sessionId: number, tokenHash: string): Promise<void> {
  await AdminSessionModel.updateOne({ id: sessionId }, { $set: { token_hash: tokenHash } });
}

export async function findAdminSessionByTokenHash(tokenHash: string): Promise<AdminSessionRow | null> {
  const row = await AdminSessionModel.findOne({ token_hash: tokenHash }).lean();
  return row ? sessionRow(row) : null;
}

export async function findAdminSessionById(sessionId: number): Promise<AdminSessionRow | null> {
  const row = await AdminSessionModel.findOne({ id: sessionId }).lean();
  return row ? sessionRow(row) : null;
}

export async function deleteAdminSessionById(sessionId: number): Promise<void> {
  await AdminSessionModel.deleteOne({ id: sessionId });
}

export async function deleteAllAdminSessionsForAdmin(adminId: number): Promise<void> {
  await AdminSessionModel.deleteMany({ admin_id: adminId });
}

export async function createAdmin(
  email: string,
  passwordHash: string,
  name: string,
  role: string
): Promise<number> {
  const id = await nextId('admins');
  await AdminModel.create({
    id,
    email: email.trim(),
    password_hash: passwordHash,
    name: name.trim(),
    role,
    deleted_at: null,
  });
  return id;
}

export async function updateAdminPassword(adminId: number, passwordHash: string): Promise<void> {
  await AdminModel.updateOne({ id: adminId, deleted_at: null }, { $set: { password_hash: passwordHash } });
}

export async function updateAdminName(adminId: number, name: string): Promise<void> {
  await AdminModel.updateOne({ id: adminId, deleted_at: null }, { $set: { name: name.trim() } });
}
