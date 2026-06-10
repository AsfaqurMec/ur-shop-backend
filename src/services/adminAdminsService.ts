import { AppError } from '../middlewares/errorHandler';
import * as adminAuthRepo from '../repositories/adminAuthRepository';
import { hashPassword, comparePassword } from '../utils/passwordHelpers';
import type { SafeUser } from '../types/auth';

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
  };
}

export async function changeAdminPassword(
  adminId: number,
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  const admin = await adminAuthRepo.findAdminById(adminId);
  if (!admin) {
    throw new AppError(404, 'Admin not found');
  }
  const valid = await comparePassword(currentPassword, admin.password_hash);
  if (!valid) {
    throw new AppError(401, 'Current password is incorrect');
  }
  const passwordHash = await hashPassword(newPassword);
  await adminAuthRepo.updateAdminPassword(adminId, passwordHash);
  await adminAuthRepo.deleteAllAdminSessionsForAdmin(adminId);
  return { message: 'Password updated. Please sign in again.' };
}

export async function createAdmin(
  email: string,
  password: string,
  name: string
): Promise<{ admin: SafeUser }> {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await adminAuthRepo.findAdminByEmail(normalizedEmail);
  if (existing) {
    throw new AppError(409, 'An admin with this email already exists');
  }
  const passwordHash = await hashPassword(password);
  const displayName = (name?.trim() || normalizedEmail) as string;
  const id = await adminAuthRepo.createAdmin(normalizedEmail, passwordHash, displayName, 'admin');
  const row = await adminAuthRepo.findAdminById(id);
  if (!row) {
    throw new AppError(500, 'Failed to create admin');
  }
  return { admin: toSafeAdmin(row) };
}
