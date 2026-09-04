import { Response } from 'express';
export declare function getCookieOptions(maxAgeMs?: number): {
    maxAge?: number | undefined;
    httpOnly: boolean;
    secure: boolean;
    sameSite: "none" | "lax" | "strict";
    path: string;
};
export declare function setAuthCookies(res: Response, accessToken: string, refreshToken?: string): void;
export declare function clearAuthCookies(res: Response): void;
//# sourceMappingURL=cookieHelpers.d.ts.map