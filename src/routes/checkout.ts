import { Router } from 'express';
import * as checkoutController from '../controllers/checkoutController';
import { validate } from '../middlewares/validate';
import { optionalAuth } from '../middlewares/auth';
import { checkoutLimiter } from '../middlewares/security';
import { asyncHandler } from '../utils/asyncHandler';
import { createOrderValidator } from '../validators/checkoutValidators';
import { orderIdParamValidator } from '../validators/dashboardValidators';

const router = Router();

router.post(
  '/orders',
  checkoutLimiter,
  optionalAuth,
  validate(createOrderValidator),
  asyncHandler(checkoutController.createOrder)
);

router.get(
  '/orders/:orderId/invoice',
  optionalAuth,
  validate(orderIdParamValidator),
  asyncHandler(checkoutController.downloadOrderInvoice)
);

export default router;
