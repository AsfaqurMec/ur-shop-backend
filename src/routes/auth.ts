import { Router } from 'express';
import * as authController from '../controllers/authController';
import { validate } from '../middlewares/validate';
import { auth, optionalAuth } from '../middlewares/auth';
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
  guestAccountStatusValidator,
  continueCheckoutValidator,
} from '../validators/authValidators';

import { authLimiter } from '../middlewares/security';

const router = Router();

router.post('/register', authLimiter, validate(registerValidator), asyncHandler(authController.register));
router.post('/guest-checkout', authLimiter, validate(guestCheckoutValidator), asyncHandler(authController.guestCheckout));
router.post('/guest-account-status', validate(guestAccountStatusValidator), asyncHandler(authController.guestAccountStatus));
router.post('/continue-checkout', authLimiter, validate(continueCheckoutValidator), asyncHandler(authController.continueCheckout));
router.post('/login', authLimiter, validate(loginValidator), asyncHandler(authController.login));
router.post('/logout', optionalAuth, asyncHandler(authController.logout));
router.post('/refresh', validate(refreshValidator), asyncHandler(authController.refresh));
router.post('/verify-email', validate(verifyEmailValidator), asyncHandler(authController.verifyEmail));
router.get('/verify-email', validate(verifyEmailQueryValidator), asyncHandler(authController.verifyEmail));
router.post('/forgot-password', authLimiter, validate(forgotPasswordValidator), asyncHandler(authController.forgotPassword));
router.post('/reset-password', authLimiter, validate(resetPasswordValidator), asyncHandler(authController.resetPassword));
router.get('/me', auth, asyncHandler(authController.getProfile));
router.patch('/me', auth, validate(updateProfileValidator), asyncHandler(authController.updateProfile));
router.post('/change-password', auth, validate(changePasswordValidator), asyncHandler(authController.changePassword));

export default router;
