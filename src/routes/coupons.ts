import { Router } from 'express';
import * as couponController from '../controllers/couponController';
import { validate } from '../middlewares/validate';
import { auth } from '../middlewares/auth';
import { admin } from '../middlewares/admin';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createCouponValidator,
  updateCouponValidator,
  couponIdParamValidator,
  setActiveValidator,
  validateCouponValidator,
} from '../validators/couponValidators';

const router = Router();

// Authenticated: validate coupon (for cart/checkout)
router.post('/validate', auth, validate(validateCouponValidator), asyncHandler(couponController.validate));

// Admin only
router.get('/', auth, admin, asyncHandler(couponController.list));
router.get('/:id', auth, admin, validate(couponIdParamValidator), asyncHandler(couponController.getById));
router.post('/', auth, admin, validate(createCouponValidator), asyncHandler(couponController.create));
router.put('/:id', auth, admin, validate(updateCouponValidator), asyncHandler(couponController.update));
router.delete('/:id', auth, admin, validate(couponIdParamValidator), asyncHandler(couponController.remove));
router.patch('/:id/active', auth, admin, validate(setActiveValidator), asyncHandler(couponController.setActive));

export default router;
