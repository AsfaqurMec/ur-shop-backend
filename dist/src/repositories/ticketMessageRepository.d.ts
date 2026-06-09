import type { TicketMessageRow, TicketSenderType } from '../types/ticket';
export declare function create(data: {
    ticket_id: number;
    sender_type: TicketSenderType;
    user_id: number | null;
    admin_id: number | null;
    message: string;
}): Promise<number>;
export declare function findByTicketId(ticketId: number): Promise<TicketMessageRow[]>;
//# sourceMappingURL=ticketMessageRepository.d.ts.map