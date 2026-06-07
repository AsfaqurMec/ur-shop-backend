declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        id: number;
        email: string;
        role: string;
        sessionId: number;
      };
    }
  }
}

export {};
