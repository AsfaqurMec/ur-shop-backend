export interface VerifyEmailData {
    verifyUrl: string;
    token?: string;
}
export declare function renderVerifyEmail(data: VerifyEmailData): {
    subject: string;
    html: string;
    text: string;
};
//# sourceMappingURL=verifyEmail.d.ts.map