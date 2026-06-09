export type EmailLogStatus = 'sent' | 'failed';
export interface EmailLogRow {
    id: number;
    to_email: string;
    subject: string | null;
    template: string | null;
    status: EmailLogStatus;
    error_message: string | null;
    sent_at: Date;
}
export interface CreateEmailLogInput {
    to_email: string;
    subject: string | null;
    template: string | null;
    status: EmailLogStatus;
    error_message?: string | null;
}
export declare function create(data: CreateEmailLogInput): Promise<number>;
export declare function findRecentByTo(toEmail: string, limit?: number): Promise<EmailLogRow[]>;
export declare function countLogs(template?: string | null): Promise<number>;
export declare function listPaginated(limit: number, offset: number, template?: string | null): Promise<EmailLogRow[]>;
export declare function listDistinctTemplates(): Promise<string[]>;
//# sourceMappingURL=emailLogRepository.d.ts.map