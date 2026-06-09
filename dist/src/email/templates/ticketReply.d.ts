export interface TicketReplyData {
    ticketId: number;
    subject: string;
    messagePreview: string;
    ticketUrl?: string;
}
export declare function renderTicketReply(data: TicketReplyData): {
    subject: string;
    html: string;
    text: string;
};
//# sourceMappingURL=ticketReply.d.ts.map