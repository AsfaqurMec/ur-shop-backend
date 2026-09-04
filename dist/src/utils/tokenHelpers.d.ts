export declare const ROLE_ADMIN = "admin";
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
export declare function hashToken(token: string): string;
export declare function generateAccessToken(payload: Omit<AccessTokenPayload, 'role' | 'type'>, role?: string): string;
export declare function generateRefreshToken(payload: Omit<RefreshTokenPayload, 'role' | 'type'>, role?: string): string;
export declare function verifyAccessToken(token: string): AccessTokenPayload;
export declare function verifyRefreshToken(token: string): RefreshTokenPayload;
export declare function getRefreshTokenExpiry(): Date;
//# sourceMappingURL=tokenHelpers.d.ts.map