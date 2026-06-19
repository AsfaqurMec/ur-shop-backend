import { AppError } from '../middlewares/errorHandler';
import * as adminDashboardRepo from '../repositories/adminDashboardRepository';
import * as authRepo from '../repositories/authRepository';
import * as emailLogRepo from '../repositories/emailLogRepository';
import type { EmailLogRow } from '../repositories/emailLogRepository';
import type {
  AdminDashboardSummary,
  AdminSalesSummary,
  AdminOrdersByStatus,
  AdminRecentOrder,
  AdminRecentPayment,
  AdminTopProduct,
  AdminLowStockLicense,
  AdminCustomerListItem,
} from '../types/adminDashboard';

const DEFAULT_RECENT_LIMIT = 10;
const DEFAULT_EMAIL_LOG_LIMIT = 10;
const DEFAULT_TOP_PRODUCTS_LIMIT = 10;
const DEFAULT_LOW_STOCK_THRESHOLD = 5;

export async function getDashboardSummary(): Promise<AdminDashboardSummary> {
  return adminDashboardRepo.getDashboardSummary();
}

export async function getSalesSummary(): Promise<AdminSalesSummary> {
  return adminDashboardRepo.getSalesSummary();
}

export async function getOrdersByStatus(): Promise<AdminOrdersByStatus[]> {
  return adminDashboardRepo.getOrdersByStatus();
}

export async function getRecentOrders(
  limit?: number,
  offset?: number,
  status?: string
): Promise<{ orders: AdminRecentOrder[]; total: number }> {
  return adminDashboardRepo.getRecentOrders(limit ?? DEFAULT_RECENT_LIMIT, offset ?? 0, status);
}

export async function updateOrderStatus(
  orderId: number,
  status: 'pending' | 'paid' | 'unpaid'
): Promise<AdminRecentOrder> {
  const ok = await adminDashboardRepo.updateOrderStatus(orderId, status);
  if (!ok) throw new AppError(404, 'Order not found');
  const detail = await adminDashboardRepo.getOrderListItemById(orderId);
  if (detail) return detail;
  throw new AppError(404, 'Order not found');
}

export async function getEmailLogs(
  limit?: number,
  offset?: number,
  template?: string
): Promise<{ logs: EmailLogRow[]; total: number; templates: string[] }> {
  const lim = limit ?? DEFAULT_EMAIL_LOG_LIMIT;
  const off = offset ?? 0;
  const templateFilter = template && template.length > 0 ? template : undefined;
  const [logs, total, templates] = await Promise.all([
    emailLogRepo.listPaginated(lim, off, templateFilter),
    emailLogRepo.countLogs(templateFilter),
    emailLogRepo.listDistinctTemplates(),
  ]);
  return { logs, total, templates };
}

export async function getRecentPayments(limit?: number): Promise<{
  payments: AdminRecentPayment[];
}> {
  const payments = await adminDashboardRepo.getRecentPayments(
    limit ?? DEFAULT_RECENT_LIMIT
  );
  return { payments };
}

export async function getTopProducts(limit?: number): Promise<{
  products: AdminTopProduct[];
}> {
  const products = await adminDashboardRepo.getTopProducts(
    limit ?? DEFAULT_TOP_PRODUCTS_LIMIT
  );
  return { products };
}

export async function getLowStockLicenseProducts(threshold?: number): Promise<{
  products: AdminLowStockLicense[];
}> {
  const products = await adminDashboardRepo.getLowStockLicenseProducts(
    threshold ?? DEFAULT_LOW_STOCK_THRESHOLD
  );
  return { products };
}

export async function getPendingFulfillmentCount(): Promise<{ count: number }> {
  const count = await adminDashboardRepo.getPendingFulfillmentCount();
  return { count };
}

export async function getPendingTicketsCount(): Promise<{ count: number }> {
  const count = await adminDashboardRepo.getPendingTicketsCount();
  return { count };
}

export async function getCustomersWithOrders(
  limit?: number,
  offset?: number
): Promise<{ customers: AdminCustomerListItem[]; total: number }> {
  return adminDashboardRepo.getCustomersWithOrders(limit ?? DEFAULT_RECENT_LIMIT, offset ?? 0);
}

export async function updateCustomer(
  userId: number,
  data: { email: string; name: string; mobile?: string | null; address?: string | null }
): Promise<AdminCustomerListItem> {
  const user = await authRepo.findUserById(userId);
  if (!user) throw new AppError(404, 'Customer not found');
  const hasOrders = await adminDashboardRepo.userHasOrders(userId);
  if (!hasOrders) throw new AppError(404, 'Customer not found');
  if (await authRepo.emailExistsExcludingUser(data.email, userId)) {
    throw new AppError(409, 'Email already in use');
  }
  await authRepo.updateUserProfile(userId, {
    email: data.email,
    name: data.name,
    mobile: data.mobile,
    address: data.address,
  });
  const row = await adminDashboardRepo.getCustomerAggregateById(userId);
  if (!row) throw new AppError(500, 'Failed to load customer');
  return row;
}

export async function deleteCustomer(userId: number): Promise<void> {
  const user = await authRepo.findUserById(userId);
  if (!user) throw new AppError(404, 'Customer not found');
  const hasOrders = await adminDashboardRepo.userHasOrders(userId);
  if (!hasOrders) throw new AppError(404, 'Customer not found');
  const ok = await authRepo.softDeleteUser(userId);
  if (!ok) throw new AppError(404, 'Customer not found');
  await authRepo.deleteSessionsByUserId(userId);
}

export async function deleteOrder(id: number): Promise<void> {
  const existed = await adminDashboardRepo.softDelete(id);
  if (!existed) throw new AppError(404, 'Category not found');
}
