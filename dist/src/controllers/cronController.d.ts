import type { Request, Response } from 'express';
/** POST /cron/subscription-expiry-reminders — header X-Cron-Secret must match CRON_SECRET. */
export declare function runSubscriptionExpiryReminders(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=cronController.d.ts.map