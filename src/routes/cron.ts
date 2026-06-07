import { Router } from 'express';
import * as cronController from '../controllers/cronController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post(
  '/subscription-expiry-reminders',
  asyncHandler(cronController.runSubscriptionExpiryReminders)
);

export default router;
