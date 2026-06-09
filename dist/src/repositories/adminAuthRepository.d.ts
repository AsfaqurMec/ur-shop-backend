import type { AdminRow, AdminSessionRow } from '../types/auth';
export declare function findAdminByEmail(email: string): Promise<AdminRow | null>;
export declare function findAdminById(id: number): Promise<AdminRow | null>;
export declare function createAdminSession(adminId: number, tokenHash: string, expiresAt: Date, ip: string | null, userAgent: string | null): Promise<number>;
export declare function updateAdminSessionTokenHash(sessionId: number, tokenHash: string): Promise<void>;
export declare function findAdminSessionByTokenHash(tokenHash: string): Promise<AdminSessionRow | null>;
export declare function findAdminSessionById(sessionId: number): Promise<AdminSessionRow | null>;
export declare function deleteAdminSessionById(sessionId: number): Promise<void>;
export declare function deleteAllAdminSessionsForAdmin(adminId: number): Promise<void>;
export declare function createAdmin(email: string, passwordHash: string, name: string, role: string): Promise<number>;
export declare function updateAdminPassword(adminId: number, passwordHash: string): Promise<void>;
export declare function updateAdminName(adminId: number, name: string): Promise<void>;
//# sourceMappingURL=adminAuthRepository.d.ts.map