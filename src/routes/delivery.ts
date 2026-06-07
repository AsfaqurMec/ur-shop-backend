import { Router } from 'express';
import * as deliveryController from '../controllers/deliveryController';
import { validate } from '../middlewares/validate';
import { auth } from '../middlewares/auth';
import { admin } from '../middlewares/admin';
import { asyncHandler } from '../utils/asyncHandler';
import {
  orderIdParamValidator,
  fulfillmentIdParamValidator,
  markFulfillmentValidator,
} from '../validators/deliveryValidators';

const router = Router();

// Admin: trigger delivery processing for an order, get delivery logs
router.post(
  '/orders/:orderId/process',
  auth,
  admin,
  validate(orderIdParamValidator),
  asyncHandler(deliveryController.processDelivery)
);
router.get(
  '/orders/:orderId/logs',
  auth,
  validate(orderIdParamValidator),
  asyncHandler(deliveryController.getDeliveryLogs)
);

// Admin: fulfillment queue (subscription_manual, digital_service)
router.get(
  '/fulfillment-queue',
  auth,
  admin,
  asyncHandler(deliveryController.listFulfillmentQueue)
);
router.post(
  '/fulfillment-queue/:id/fulfilled',
  auth,
  admin,
  validate(markFulfillmentValidator),
  asyncHandler(deliveryController.markFulfillmentFulfilled)
);
router.post(
  '/fulfillment-queue/:id/failed',
  auth,
  admin,
  validate(markFulfillmentValidator),
  asyncHandler(deliveryController.markFulfillmentFailed)
);

export default router;
