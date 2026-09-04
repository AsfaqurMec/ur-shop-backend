import type { SafeUser } from '../types/auth';
export declare function register(identifier: string, password: string, name: string, verificationBaseUrl?: string): Promise<{
    user: SafeUser;
    message: string;
}>;
export declare function login(identifier: string, password: string, ip: string | null, userAgent: string | null): Promise<{
    user: SafeUser;
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
}>;
export declare function logout(sessionId: number, role: string): Promise<void>;
export declare function refresh(refreshToken: string, ip: string | null, userAgent: string | null): Promise<{
    user: SafeUser;
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
}>;
export declare function verifyEmail(token: string): Promise<{
    user: SafeUser;
}>;
export declare function forgotPassword(email: string, resetBaseUrl?: string): Promise<{
    message: string;
}>;
export declare function resetPassword(token: string, newPassword: string): Promise<{
    message: string;
}>;
export declare function getProfile(userId: number, role: string): Promise<SafeUser>;
export declare function updateProfileName(userId: number, role: string, name: string): Promise<SafeUser>;
export declare function updateUserProfile(userId: number, role: string, data: {
    name: string;
    mobile?: string | null;
    address?: string | null;
}): Promise<SafeUser>;
/** @deprecated Guest checkout no longer creates accounts. Place orders directly via POST /checkout/orders */
export declare function guestCheckout(_name?: string, _mobile?: string, _address?: string, _ip?: string | null, _userAgent?: string | null): Promise<never>;
export declare function changePassword(userId: number, role: string, currentPassword: string, newPassword: string): Promise<void>;
export declare function hasAccountForMobile(mobile: string): Promise<boolean>;
/** @deprecated Removed due to authentication bypass risks. */
export declare function continueCheckout(_mobile?: string, _ip?: string | null, _userAgent?: string | null): Promise<never>;
//# sourceMappingURL=authService.d.ts.map