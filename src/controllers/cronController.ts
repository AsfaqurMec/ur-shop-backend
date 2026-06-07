import { env } from '../config';
import { AppError } from '../middlewares/errorHandler';
import * as subscriptionReminderService from '../services/subscriptionReminderService';
import type { Request, Response } from 'express';

/** POST /cron/subscription-expiry-reminders — header X-Cron-Secret must match CRON_SECRET. */
export async function runSubscriptionExpiryReminders(req: Request, res: Response): Promise<void> {
  if (!env.cronSecret) {
    throw new AppError(503, 'Cron is not configured (set CRON_SECRET)');
  }
  if (req.get('x-cron-secret') !== env.cronSecret) {
    throw new AppError(401, 'Unauthorized');
  }
  const data = await subscriptionReminderService.sendSubscriptionExpiryReminders();
  res.json({ success: true, data });
}
