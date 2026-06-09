import { Response } from 'express';
export interface ApiSuccess<T = unknown> {
    success: true;
    data: T;
    message?: string;
}
export interface ApiError {
    success: false;
    error: string;
    message?: string;
}
export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;
export declare function sendSuccess<T>(res: Response, data: T, statusCode?: number, message?: string): Response;
export declare function sendError(res: Response, error: string, statusCode?: number, message?: string): Response;
//# sourceMappingURL=apiResponse.d.ts.map