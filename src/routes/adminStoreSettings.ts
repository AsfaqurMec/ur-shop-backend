import { Router } from 'express';
import * as storeSettingsController from '../controllers/storeSettingsController';
import { validate } from '../middlewares/validate';
import { auth } from '../middlewares/auth';
import { admin } from '../middlewares/admin';
import { asyncHandler } from '../utils/asyncHandler';
import { updateStoreSettingsValidator } from '../validators/storeSettingsValidators';
import { uploadSettingsLogo } from '../middlewares/upload';

const router = Router();

router.use(auth);
router.use(admin);

router.get('/', asyncHandler(storeSettingsController.getAdminStoreSettings));
router.put(
  '/',
  validate(updateStoreSettingsValidator),
  asyncHandler(storeSettingsController.updateAdminStoreSettings)
);
router.post(
  '/upload-logo',
  (req, res, next) => uploadSettingsLogo(req, res, (err) => (err ? next(err) : next())),
  asyncHandler(storeSettingsController.uploadStoreLogo)
);

export default router;
