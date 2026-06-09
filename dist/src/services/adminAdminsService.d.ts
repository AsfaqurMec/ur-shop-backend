import type { SafeUser } from '../types/auth';
export declare function changeAdminPassword(adminId: number, currentPassword: string, newPassword: string): Promise<{
    message: string;
}>;
export declare function createAdmin(email: string, password: string, name: string): Promise<{
    admin: SafeUser;
}>;
//# sourceMappingURL=adminAdminsService.d.ts.map