import { Router } from 'express';
import * as checkoutController from '../controllers/checkoutController';
import { validate } from '../middlewares/validate';
import { auth } from '../middlewares/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { createOrderValidator } from '../validators/checkoutValidators';

const router = Router();

router.post(
  '/orders',
  auth,
  validate(createOrderValidator),
  asyncHandler(checkoutController.createOrder)
);

export default router;
