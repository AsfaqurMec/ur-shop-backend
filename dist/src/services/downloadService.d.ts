import type { Response } from 'express';
import type { DownloadableItemPublic, DownloadTokenPublic } from '../types/download';
/** List current user's downloadable items (entitlements with file info and download count/limit). */
export declare function listDownloadables(userId: number): Promise<DownloadableItemPublic[]>;
/** Generate a secure temporary download token for an entitlement owned by the user. */
export declare function createDownloadToken(userId: number, entitlementId: number): Promise<DownloadTokenPublic>;
/** Validate token, record download, increment token use, then stream file. Call from controller. */
export declare function validateTokenAndStream(token: string, res: Response, ip: string | null, userAgent: string | null): Promise<void>;
//# sourceMappingURL=downloadService.d.ts.map