import type { Attachment } from 'nodemailer/lib/mailer';
export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
    attachments?: Attachment[];
}
export declare function sendEmail(options: SendEmailOptions): Promise<boolean>;
//# sourceMappingURL=emailHelpers.d.ts.map