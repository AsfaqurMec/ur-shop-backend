import type { DownloadTokenRow } from '../types/download';
export declare function create(_conn: unknown, data: {
    token: string;
    entitlement_id: number;
    user_id: number;
    expires_at: Date;
    max_uses: number;
}): Promise<number>;
export declare function findByToken(token: string): Promise<DownloadTokenRow | null>;
export declare function incrementUseCount(_conn: unknown, tokenId: number): Promise<boolean>;
//# sourceMappingURL=downloadTokenRepository.d.ts.map