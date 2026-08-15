import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController';
import { validate } from '../middlewares/validate';
import { auth } from '../middlewares/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { orderIdParamValidator, ordersListValidator } from '../validators/dashboardValidators';

const router = Router();

router.use(auth);

/** My orders list (paginated). */
router.get(
  '/orders',
  validate(ordersListValidator),
  asyncHandler(dashboardController.getMyOrders)
);

/** Order details (must own order). */
router.get(
  '/orders/:orderId/invoice',
  validate(orderIdParamValidator),
  asyncHandler(dashboardController.downloadOrderInvoice)
);

router.get(
  '/orders/:orderId',
  validate(orderIdParamValidator),
  asyncHandler(dashboardController.getOrderDetails)
);

/** My downloadable items. */
router.get('/downloads', asyncHandler(dashboardController.getMyDownloads));

/** My assigned license keys. */
router.get('/licenses', asyncHandler(dashboardController.getMyLicenses));

/** My subscriptions. */
router.get('/subscriptions', asyncHandler(dashboardController.getMySubscriptions));
router.get('/subscriptions/pending', asyncHandler(dashboardController.getMyPendingSubscriptions));

/** My delivered items (downloads + licenses + subscriptions + fulfilled). */
router.get('/delivered', asyncHandler(dashboardController.getMyDeliveredItems));

/** Dashboard summary counts. */
router.get('/summary', asyncHandler(dashboardController.getDashboardSummary));

export default router;
