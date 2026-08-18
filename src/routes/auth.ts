import { Router } from 'express';
import * as authController from '../controllers/authController';
import { validate } from '../middlewares/validate';
import { auth } from '../middlewares/auth';
import { asyncHandler } from '../utils/asyncHandler';
import {
  registerValidator,
  loginValidator,
  refreshValidator,
  verifyEmailValidator,
  verifyEmailQueryValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  updateProfileValidator,
  guestCheckoutValidator,
  changePasswordValidator,
} from '../validators/authValidators';

const router = Router();

router.post('/register', validate(registerValidator), asyncHandler(authController.register));
router.post('/guest-checkout', validate(guestCheckoutValidator), asyncHandler(authController.guestCheckout));
router.post('/login', validate(loginValidator), asyncHandler(authController.login));
router.post('/logout', auth, asyncHandler(authController.logout));
router.post('/refresh', validate(refreshValidator), asyncHandler(authController.refresh));
router.post('/verify-email', validate(verifyEmailValidator), asyncHandler(authController.verifyEmail));
router.get('/verify-email', validate(verifyEmailQueryValidator), asyncHandler(authController.verifyEmail));
router.post('/forgot-password', validate(forgotPasswordValidator), asyncHandler(authController.forgotPassword));
router.post('/reset-password', validate(resetPasswordValidator), asyncHandler(authController.resetPassword));
router.get('/me', auth, asyncHandler(authController.getProfile));
router.patch('/me', auth, validate(updateProfileValidator), asyncHandler(authController.updateProfile));
router.post('/change-password', auth, validate(changePasswordValidator), asyncHandler(authController.changePassword));

export default router;
