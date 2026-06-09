import type { TicketAttachmentRow } from '../types/ticket';
export declare function create(data: {
    ticket_message_id: number;
    file_path: string;
    file_name: string;
    file_size: number | null;
}): Promise<number>;
export declare function findByMessageId(ticketMessageId: number): Promise<TicketAttachmentRow[]>;
export declare function findById(id: number): Promise<TicketAttachmentRow | null>;
export declare function findByIdWithTicketId(id: number): Promise<(TicketAttachmentRow & {
    ticket_id: number;
}) | null>;
//# sourceMappingURL=ticketAttachmentRepository.d.ts.map