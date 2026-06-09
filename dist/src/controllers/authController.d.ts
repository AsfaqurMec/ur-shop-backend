import { Request, Response } from 'express';
export declare function register(req: Request, res: Response): Promise<Response>;
export declare function login(req: Request, res: Response): Promise<Response>;
export declare function logout(req: Request, res: Response): Promise<Response>;
export declare function refresh(req: Request, res: Response): Promise<Response>;
export declare function verifyEmail(req: Request, res: Response): Promise<Response>;
export declare function forgotPassword(req: Request, res: Response): Promise<Response>;
export declare function resetPassword(req: Request, res: Response): Promise<Response>;
export declare function getProfile(req: Request, res: Response): Promise<Response>;
export declare function updateProfile(req: Request, res: Response): Promise<Response>;
//# sourceMappingURL=authController.d.ts.map