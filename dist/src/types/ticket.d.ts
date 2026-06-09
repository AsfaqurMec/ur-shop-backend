export type TicketStatus = 'open' | 'answered' | 'customer_reply' | 'closed';
export type TicketSenderType = 'user' | 'admin';
export interface TicketRow {
    id: number;
    user_id: number;
    order_id: number | null;
    subject: string;
    status: TicketStatus;
    created_at: Date;
    updated_at: Date;
}
export interface TicketMessageRow {
    id: number;
    ticket_id: number;
    sender_type: TicketSenderType;
    user_id: number | null;
    admin_id: number | null;
    message: string;
    created_at: Date;
}
export interface TicketAttachmentRow {
    id: number;
    ticket_message_id: number;
    file_path: string;
    file_name: string;
    file_size: number | null;
    created_at: Date;
}
/** For list responses */
export interface TicketListItemPublic {
    id: number;
    subject: string;
    status: TicketStatus;
    order_id: number | null;
    order_number: string | null;
    created_at: string;
    updated_at: string;
}
/** Message with attachments for detail view */
export interface TicketMessagePublic {
    id: number;
    sender_type: TicketSenderType;
    message: string;
    created_at: string;
    attachments: TicketAttachmentPublic[];
}
export interface TicketAttachmentPublic {
    id: number;
    file_name: string;
    file_size: number | null;
    url_path: string;
}
/** Full ticket detail for customer/admin view */
export interface TicketDetailPublic {
    id: number;
    subject: string;
    status: TicketStatus;
    order_id: number | null;
    order_number: string | null;
    user_id: number;
    created_at: string;
    updated_at: string;
    messages: TicketMessagePublic[];
}
//# sourceMappingURL=ticket.d.ts.map