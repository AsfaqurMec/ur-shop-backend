import type { TicketStatus, TicketListItemPublic, TicketDetailPublic } from '../types/ticket';
/** Customer: create ticket with optional order link and optional first-message attachment. */
export declare function createTicket(userId: number, data: {
    subject: string;
    message: string;
    order_id?: number | null;
    attachment_path?: string | null;
    attachment_name?: string | null;
    attachment_size?: number | null;
}): Promise<TicketDetailPublic>;
/** Customer: list own tickets (paginated, optional status filter). */
export declare function listMyTickets(userId: number, options?: {
    status?: TicketStatus;
    limit?: number;
    offset?: number;
}): Promise<{
    tickets: TicketListItemPublic[];
    total: number;
}>;
/** Customer: get ticket details (must own ticket). */
export declare function getTicketDetails(userId: number, ticketId: number): Promise<TicketDetailPublic>;
/** Admin: get any ticket details. */
export declare function getTicketDetailsAdmin(ticketId: number): Promise<TicketDetailPublic>;
/** Admin: count tickets with a given status (e.g. open). */
export declare function countTicketsByStatus(status: TicketStatus): Promise<{
    count: number;
}>;
/** Customer: count own tickets with a given status (e.g. answered). */
export declare function countMyTicketsByStatus(userId: number, status: TicketStatus): Promise<{
    count: number;
}>;
/** Admin: list all tickets with optional status filter. */
export declare function listAllTickets(options?: {
    status?: TicketStatus;
    limit?: number;
    offset?: number;
}): Promise<{
    tickets: TicketListItemPublic[];
}>;
/** Customer: reply to own ticket; optional attachment. Sets status to customer_reply. */
export declare function reply(userId: number, ticketId: number, data: {
    message: string;
    attachment_path?: string | null;
    attachment_name?: string | null;
    attachment_size?: number | null;
}): Promise<TicketDetailPublic>;
/** Admin: reply to ticket. Sets status to answered. */
export declare function adminReply(adminId: number, ticketId: number, data: {
    message: string;
    attachment_path?: string | null;
    attachment_name?: string | null;
    attachment_size?: number | null;
}): Promise<TicketDetailPublic>;
/** Admin: change ticket status. */
export declare function updateStatus(ticketId: number, status: TicketStatus): Promise<TicketDetailPublic>;
/** Get attachment for download; throws if not found or access denied. */
export declare function getAttachmentForDownload(attachmentId: number, options: {
    userId?: number;
    isAdmin?: boolean;
}): Promise<{
    file_path: string;
    file_name: string;
}>;
//# sourceMappingURL=ticketService.d.ts.map