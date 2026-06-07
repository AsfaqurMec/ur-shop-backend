import { Router } from 'express';
import * as storeSettingsController from '../controllers/storeSettingsController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/public', asyncHandler(storeSettingsController.getPublicStoreSettings));

export default router;
