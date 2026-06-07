import { Router } from 'express';
import * as adminAdminsController from '../controllers/adminAdminsController';
import { validate } from '../middlewares/validate';
import { auth } from '../middlewares/auth';
import { admin } from '../middlewares/admin';
import { asyncHandler } from '../utils/asyncHandler';
import { changeAdminPasswordValidator, createAdminValidator } from '../validators/adminAdminsValidators';

const router = Router();

router.use(auth);
router.use(admin);

/** Current admin: verify current password, set new password, invalidate all admin sessions for this account. */
router.post(
  '/me/password',
  validate(changeAdminPasswordValidator),
  asyncHandler(adminAdminsController.changePassword)
);

/** Create another admin account (same privileges). */
router.post('/', validate(createAdminValidator), asyncHandler(adminAdminsController.createAdmin));

export default router;
