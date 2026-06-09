import type { TicketRow, TicketStatus } from '../types/ticket';
export declare function create(data: {
    user_id: number;
    order_id: number | null;
    subject: string;
}): Promise<number>;
export declare function findById(id: number): Promise<TicketRow | null>;
export interface TicketListRow {
    id: number;
    subject: string;
    status: string;
    order_id: number | null;
    order_number: string | null;
    created_at: Date;
    updated_at: Date;
}
export declare function findTicketsForUser(userId: number, options: {
    status?: TicketStatus;
    limit: number;
    offset: number;
}): Promise<TicketListRow[]>;
export declare function countTicketsForUser(userId: number, options?: {
    status?: TicketStatus;
}): Promise<number>;
export declare function findAll(options?: {
    status?: TicketStatus;
    limit?: number;
    offset?: number;
}): Promise<TicketListRow[]>;
export declare function updateStatus(id: number, status: TicketStatus): Promise<boolean>;
export declare function findByIdWithOrderNumber(id: number): Promise<(TicketRow & {
    order_number: string | null;
}) | null>;
export declare function countByStatus(status: TicketStatus): Promise<number>;
export declare function countByUserIdAndStatus(userId: number, status: TicketStatus): Promise<number>;
//# sourceMappingURL=ticketRepository.d.ts.map