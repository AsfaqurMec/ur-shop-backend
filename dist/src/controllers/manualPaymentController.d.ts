import { Request, Response } from 'express';
export declare function listPaymentMethods(_req: Request, res: Response): Promise<Response>;
export declare function submitProof(req: Request, res: Response): Promise<Response>;
export declare function getProofsForOrder(req: Request, res: Response): Promise<Response>;
export declare function listPendingProofs(req: Request, res: Response): Promise<Response>;
export declare function listRecentProofsAdmin(req: Request, res: Response): Promise<Response>;
export declare function downloadProofFile(req: Request, res: Response): Promise<void>;
export declare function approveProof(req: Request, res: Response): Promise<Response>;
export declare function rejectProof(req: Request, res: Response): Promise<Response>;
//# sourceMappingURL=manualPaymentController.d.ts.map