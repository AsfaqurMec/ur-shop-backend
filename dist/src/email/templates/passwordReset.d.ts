export interface PasswordResetData {
    resetUrl: string;
    expiresInHours: number;
}
export declare function renderPasswordReset(data: PasswordResetData): {
    subject: string;
    html: string;
    text: string;
};
//# sourceMappingURL=passwordReset.d.ts.map