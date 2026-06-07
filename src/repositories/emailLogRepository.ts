import { EmailLogModel } from '../database/models';
import { nextId } from '../database/counter';

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

function date(v: unknown): Date {
  return v ? new Date(v as string | number | Date) : new Date();
}

function row(r: any): EmailLogRow {
  return {
    id: Number(r.id),
    to_email: String(r.to_email),
    subject: r.subject != null ? String(r.subject) : null,
    template: r.template != null ? String(r.template) : null,
    status: r.status as EmailLogStatus,
    error_message: r.error_message != null ? String(r.error_message) : null,
    sent_at: date(r.sent_at ?? r.created_at),
  };
}

export async function create(data: CreateEmailLogInput): Promise<number> {
  const id = await nextId('email_logs');
  await EmailLogModel.create({ id, ...data, error_message: data.error_message ?? null, sent_at: new Date() });
  return id;
}

export async function findRecentByTo(toEmail: string, limit = 50): Promise<EmailLogRow[]> {
  const rows = await EmailLogModel.find({ to_email: toEmail }).sort({ sent_at: -1, created_at: -1 }).limit(limit).lean();
  return rows.map(row);
}

export async function countLogs(template?: string | null): Promise<number> {
  return EmailLogModel.countDocuments(template ? { template } : {});
}

export async function listPaginated(limit: number, offset: number, template?: string | null): Promise<EmailLogRow[]> {
  const rows = await EmailLogModel.find(template ? { template } : {})
    .sort({ sent_at: -1, created_at: -1 })
    .skip(offset)
    .limit(limit)
    .lean();
  return rows.map(row);
}

export async function listDistinctTemplates(): Promise<string[]> {
  const values = await EmailLogModel.distinct('template', { template: { $nin: [null, ''] } });
  return values.map(String).sort((a, b) => a.localeCompare(b));
}
