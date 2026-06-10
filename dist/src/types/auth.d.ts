export interface UserRow {
    id: number;
    email: string;
    password_hash: string;
    name: string;
    mobile: string | null;
    address: string | null;
    email_verified_at: Date | null;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
}
export interface AdminRow {
    id: number;
    email: string;
    password_hash: string;
    name: string;
    role: string;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
}
export interface AdminSessionRow {
    id: number;
    admin_id: number;
    token_hash: string;
    ip: string | null;
    user_agent: string | null;
    expires_at: Date;
    created_at: Date;
}
export interface UserSessionRow {
    id: number;
    user_id: number;
    token_hash: string;
    ip: string | null;
    user_agent: string | null;
    expires_at: Date;
    created_at: Date;
}
export interface EmailVerificationRow {
    id: number;
    user_id: number;
    email: string;
    token: string;
    expires_at: Date;
    verified_at: Date | null;
    created_at: Date;
}
export interface PasswordResetRow {
    id: number;
    user_id: number;
    token: string;
    expires_at: Date;
    used_at: Date | null;
    created_at: Date;
}
export interface SafeUser {
    id: number;
    email: string;
    name: string;
    mobile: string | null;
    address: string | null;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    role: 'user' | 'admin';
}
//# sourceMappingURL=auth.d.ts.map