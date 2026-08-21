import { Router } from 'express';
import * as adminDashboardController from '../controllers/adminDashboardController';
import { validate } from '../middlewares/validate';
import { auth } from '../middlewares/auth';
import { admin } from '../middlewares/admin';
import { asyncHandler } from '../utils/asyncHandler';
import {
  recentListValidator,
  recentOrdersQueryValidator,
  updateOrderStatusValidator,
  emailLogsQueryValidator,
  topProductsValidator,
  lowStockValidator,
  customersListQueryValidator,
  customerUserIdParamValidator,
  updateCustomerValidator,
  deleteOrderValidator,
} from '../validators/adminDashboardValidators';
import { orderIdParamValidator } from '../validators/dashboardValidators';

const router = Router();

router.use(auth);
router.use(admin);

/** Dashboard summary counts (orders, revenue, customers, pending fulfillment, pending tickets). */
router.get(
  '/summary',
  asyncHandler(adminDashboardController.getDashboardSummary)
  
);

/** Sales summary (total revenue, paid order count). */
router.get(
  '/sales',
  asyncHandler(adminDashboardController.getSalesSummary)
);

/** Orders grouped by status. */
router.get(
  '/orders-by-status',
  asyncHandler(adminDashboardController.getOrdersByStatus)
);

/** Recent orders (query: limit, offset; default limit 10). */
router.get(
  '/recent-orders',
  validate(recentOrdersQueryValidator),
  asyncHandler(adminDashboardController.getRecentOrders)
);

/** Outbound email audit log (query: limit, offset, template). */
router.get(
  '/email-logs',
  validate(emailLogsQueryValidator),
  asyncHandler(adminDashboardController.getEmailLogs)
);

/** Customers who have placed orders (email, name, order count; query: limit, offset). */
router.get(
  '/customers',
  validate(customersListQueryValidator),
  asyncHandler(adminDashboardController.getCustomersWithOrders)
);

router.get(
  '/customers/:userId',
  validate(customerUserIdParamValidator),
  asyncHandler(adminDashboardController.getCustomerDetails)
);

router.patch(
  '/customers/:userId',
  validate(updateCustomerValidator),
  asyncHandler(adminDashboardController.updateCustomer)
);

router.delete(
  '/customers/:userId',
  validate(customerUserIdParamValidator),
  asyncHandler(adminDashboardController.deleteCustomer)
  
);

/** Recent payments (query: limit, default 10, max 200). */
router.get(
  '/recent-payments',
  validate(recentListValidator),
  asyncHandler(adminDashboardController.getRecentPayments)
);

/** Top products by quantity sold (query: limit, default 10, max 20). */
router.get(
  '/top-products',
  validate(topProductsValidator),
  asyncHandler(adminDashboardController.getTopProducts)
);

/** Low stock license key products (query: threshold, default 5). */
router.get(
  '/low-stock-licenses',
  validate(lowStockValidator),
  asyncHandler(adminDashboardController.getLowStockLicenseProducts)
);

/** Pending fulfillment queue count. */
router.get(
  '/pending-fulfillment-count',
  asyncHandler(adminDashboardController.getPendingFulfillmentCount)
);

/** Pending (non-closed) tickets count. */
router.get(
  '/pending-tickets-count',
  asyncHandler(adminDashboardController.getPendingTicketsCount)
);

/** Order details by id (admin). */
router.get(
  '/orders/:orderId',
  validate(orderIdParamValidator),
  asyncHandler(adminDashboardController.getOrderDetails)
);

/** Download order invoice (admin). */
router.get(
  '/orders/:orderId/invoice',
  validate(orderIdParamValidator),
  asyncHandler(adminDashboardController.downloadOrderInvoice)
);

router.patch(
  '/orders/:orderId/status',
  validate(updateOrderStatusValidator),
  asyncHandler(adminDashboardController.updateOrderStatus)
);

router.delete('/orders/:id', auth, admin, validate(deleteOrderValidator), asyncHandler(adminDashboardController.remove));

export default router;
