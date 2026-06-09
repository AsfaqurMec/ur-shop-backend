import { Request, Response } from 'express';
export declare function listDownloadables(req: Request, res: Response): Promise<Response>;
export declare function createDownloadToken(req: Request, res: Response): Promise<Response>;
/** Token-based download (no auth middleware). Token is validated in service. */
export declare function downloadFile(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=downloadController.d.ts.map