import { Request, Response } from 'express';
export declare function processDelivery(req: Request, res: Response): Promise<Response>;
/** GET delivery logs for an order. Allowed for admin or order owner. */
export declare function getDeliveryLogs(req: Request, res: Response): Promise<Response>;
export declare function listFulfillmentQueue(req: Request, res: Response): Promise<Response>;
export declare function markFulfillmentFulfilled(req: Request, res: Response): Promise<Response>;
export declare function markFulfillmentFailed(req: Request, res: Response): Promise<Response>;
//# sourceMappingURL=deliveryController.d.ts.map