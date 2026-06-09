import type { Request, Response } from 'express';
export declare function createTicket(req: Request, res: Response): Promise<Response>;
export declare function listMyTickets(req: Request, res: Response): Promise<Response>;
export declare function getMyTicketCount(req: Request, res: Response): Promise<Response>;
export declare function getTicketDetails(req: Request, res: Response): Promise<Response>;
export declare function reply(req: Request, res: Response): Promise<Response>;
export declare function listAllTickets(req: Request, res: Response): Promise<Response>;
export declare function getAdminTicketCount(req: Request, res: Response): Promise<Response>;
export declare function getTicketDetailsAdmin(req: Request, res: Response): Promise<Response>;
export declare function updateStatus(req: Request, res: Response): Promise<Response>;
export declare function adminReply(req: Request, res: Response): Promise<Response>;
export declare function downloadAttachment(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=ticketController.d.ts.map