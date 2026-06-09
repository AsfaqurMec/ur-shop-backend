export interface AdminTicketNotifyData {
    ticketId: number;
    subject: string;
    excerpt: string;
    eventTitle: string;
    adminUrl?: string;
}
export declare function renderAdminTicketNotify(data: AdminTicketNotifyData): {
    subject: string;
    html: string;
    text: string;
};
//# sourceMappingURL=adminTicketNotify.d.ts.map