import {
  FulfillmentQueueModel,
  OrderItemModel,
  OrderModel,
  PaymentModel,
  ProductLicensePoolModel,
  ProductModel,
  TicketModel,
  UserModel,
} from '../database/models';
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

function iso(v: unknown): string {
  return (v ? new Date(v as string | number | Date) : new Date()).toISOString();
}

export async function getDashboardSummary(): Promise<AdminDashboardSummary> {
  const [ordersTotal, ordersPaid, paidOrders, totalUsers, pendingFulfillment, pendingTickets] =
    await Promise.all([
      OrderModel.countDocuments({}),
      OrderModel.countDocuments({ payment_status: 'paid' }),
      OrderModel.find({ payment_status: 'paid' }).lean(),
      UserModel.countDocuments({ deleted_at: null }),
      FulfillmentQueueModel.countDocuments({ status: 'pending' }),
      TicketModel.countDocuments({ status: { $in: ['open', 'answered', 'customer_reply'] } }),
    ]);

  const revenueTotal = paidOrders.reduce((sum, p: any) => sum + Number(p.total ?? 0), 0);

  return {
    orders_total: ordersTotal,
    orders_paid: ordersPaid,
    revenue_total: Math.round(revenueTotal * 100) / 100,
    customers_count: totalUsers,
    pending_fulfillment_count: pendingFulfillment,
    pending_tickets_count: pendingTickets,
  };
}

export async function getSalesSummary(): Promise<AdminSalesSummary> {
  const payments = await OrderModel.find({ payment_status: 'paid' }).lean();
  return {
    total_revenue: payments.reduce((sum, p: any) => sum + p.total, 0),
    total_orders_paid: new Set(payments.map((p: any) => Number(p.order_id))).size,
    currency: String(payments[0]?.currency || 'BDT'),
  };
}

function getDateRangeFilter(params?: { month?: number; year?: number; period?: string; days?: number }) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  if (params?.month != null && Number(params.month) >= 1 && Number(params.month) <= 12) {
    const yr = params.year ? Number(params.year) : currentYear;
    const m = Number(params.month);
    const start = new Date(yr, m - 1, 1, 0, 0, 0, 0);
    const end = new Date(yr, m, 0, 23, 59, 59, 999);
    return { start, end };
  }

  if (params?.period === 'this_month') {
    const start = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
    const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  if (params?.period === 'last_month') {
    const start = new Date(currentYear, currentMonth - 1, 1, 0, 0, 0, 0);
    const end = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
    return { start, end };
  }

  if (params?.period === 'last_3_months') {
    const start = new Date(currentYear, currentMonth - 2, 1, 0, 0, 0, 0);
    const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  if (params?.period === 'last_6_months') {
    const start = new Date(currentYear, currentMonth - 5, 1, 0, 0, 0, 0);
    const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  if (params?.period === 'this_year') {
    const start = new Date(currentYear, 0, 1, 0, 0, 0, 0);
    const end = new Date(currentYear, 11, 31, 23, 59, 59, 999);
    return { start, end };
  }

  if (params?.days != null && Number(params.days) > 0) {
    const start = new Date();
    start.setDate(start.getDate() - (Number(params.days) - 1));
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    return { start, end };
  }

  return null;
}

export async function getOrdersByStatus(params?: {
  month?: number;
  year?: number;
  period?: string;
}): Promise<{
  by_status: AdminOrdersByStatus[];
  payment_distribution: {
    paid: number;
    unpaid: number;
    total: number;
    paid_revenue: number;
    unpaid_revenue: number;
  };
}> {
  const range = getDateRangeFilter(params);
  const match: any = {};
  if (range) {
    match.created_at = { $gte: range.start, $lte: range.end };
  }

  const [statusRows, paidOrders, unpaidOrders] = await Promise.all([
    OrderModel.aggregate([
      ...(Object.keys(match).length ? [{ $match: match }] : []),
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    OrderModel.find({ ...match, payment_status: 'paid' }).lean(),
    OrderModel.find({ ...match, payment_status: { $ne: 'paid' } }).lean(),
  ]);

  const byStatus: AdminOrdersByStatus[] = statusRows.map((r: any) => ({
    status: String(r._id),
    count: Number(r.count),
  }));

  const paidCount = paidOrders.length;
  const unpaidCount = unpaidOrders.length;
  const paidRevenue = paidOrders.reduce((sum, o: any) => sum + Number(o.total ?? 0), 0);
  const unpaidRevenue = unpaidOrders.reduce((sum, o: any) => sum + Number(o.total ?? 0), 0);

  return {
    by_status: byStatus,
    payment_distribution: {
      paid: paidCount,
      unpaid: unpaidCount,
      total: paidCount + unpaidCount,
      paid_revenue: Math.round(paidRevenue * 100) / 100,
      unpaid_revenue: Math.round(unpaidRevenue * 100) / 100,
    },
  };
}

function recentOrder(row: any, customerName?: string | null): AdminRecentOrder {
  return {
    id: Number(row.id),
    order_number: String(row.order_number),
    status: String(row.status),
    payment_status: String(row.payment_status || 'unpaid'),
    total: Number(row.total ?? 0),
    currency: String(row.currency ?? 'BDT'),
    user_id: Number(row.user_id),
    shipping_mobile:
      row.shipping_mobile != null && String(row.shipping_mobile).trim()
        ? String(row.shipping_mobile).trim()
        : null,
    customer_name: customerName?.trim() || null,
    created_at: iso(row.created_at),
  };
}

export async function getRecentOrders(
  limit: number,
  offset: number,
  status?: string
): Promise<{ orders: AdminRecentOrder[]; total: number }> {
  const query = status ? { status } : {};
  const [total, rows] = await Promise.all([
    OrderModel.countDocuments(query),
    OrderModel.find(query).sort({ created_at: -1 }).skip(offset).limit(limit).lean(),
  ]);
  const userIds = [...new Set((rows as any[]).map((r) => Number(r.user_id)))];
  const users = await UserModel.find({ id: { $in: userIds }, deleted_at: null }).lean();
  const nameByUserId = new Map(users.map((u: any) => [Number(u.id), String(u.name ?? '')]));
  return {
    orders: (rows as any[]).map((r) => recentOrder(r, nameByUserId.get(Number(r.user_id)) ?? null)),
    total,
  };
}

export async function updateOrderStatus(orderId: number, status: import('../types/order').OrderStatus): Promise<boolean> {
  const result = await OrderModel.updateOne({ id: orderId }, { $set: { status } });
  return result.modifiedCount > 0;
}

export async function updateOrderPaymentStatus(orderId: number, paymentStatus: 'paid' | 'unpaid'): Promise<boolean> {
  const result = await OrderModel.updateOne({ id: orderId }, { $set: { payment_status: paymentStatus } });
  return result.modifiedCount > 0;
}

export async function getPaidRevenueHistory(params?: {
  month?: number;
  year?: number;
  period?: string;
  days?: number;
}): Promise<Array<{ date: string; revenue: number }>> {
  const range = getDateRangeFilter(params) || {
    start: (() => {
      const d = new Date();
      d.setDate(d.getDate() - 13);
      d.setHours(0, 0, 0, 0);
      return d;
    })(),
    end: new Date(),
  };

  const rows = await OrderModel.aggregate([
    {
      $match: {
        payment_status: 'paid',
        created_at: { $gte: range.start, $lte: range.end },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
        revenue: { $sum: '$total' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const values = new Map(rows.map((row: any) => [String(row._id), Number(row.revenue ?? 0)]));

  const out: Array<{ date: string; revenue: number }> = [];
  const cur = new Date(range.start);
  while (cur <= range.end) {
    const key = cur.toISOString().slice(0, 10);
    out.push({ date: key, revenue: values.get(key) ?? 0 });
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export async function getOrderListItemById(orderId: number): Promise<AdminRecentOrder | null> {
  const row = await OrderModel.findOne({ id: orderId }).lean();
  if (!row) return null;
  const user = await UserModel.findOne({ id: Number((row as any).user_id), deleted_at: null }).lean();
  return recentOrder(row, user ? String((user as any).name ?? '') : null);
}

export async function getRecentPayments(limit: number): Promise<AdminRecentPayment[]> {
  const payments = await PaymentModel.find({}).sort({ created_at: -1 }).limit(limit).lean();
  const orderIds = payments.map((p: any) => Number(p.order_id));
  const orders = await OrderModel.find({ id: { $in: orderIds } }).lean();
  const orderById = new Map(orders.map((o: any) => [Number(o.id), o]));
  return payments.flatMap((p: any) => {
    const order = orderById.get(Number(p.order_id)) as any;
    if (!order) return [];
    return [{
      id: Number(p.id),
      order_id: Number(p.order_id),
      order_number: String(order.order_number),
      amount: Number(p.amount ?? 0),
      currency: String(p.currency ?? 'BDT'),
      gateway: String(p.gateway),
      status: String(p.status),
      created_at: iso(p.created_at),
    }];
  });
}

export async function getTopProducts(limit: number): Promise<AdminTopProduct[]> {
  const paidOrders = await OrderModel.find({ status: { $in: ['paid', 'processing', 'completed'] } }).select({ id: 1, currency: 1 }).lean();
  const orderIds = paidOrders.map((o: any) => Number(o.id));
  const currencyByOrder = new Map(paidOrders.map((o: any) => [Number(o.id), String(o.currency ?? 'BDT')]));
  const items = await OrderItemModel.find({ order_id: { $in: orderIds } }).lean();
  const byProduct = new Map<number, AdminTopProduct>();
  for (const item of items as any[]) {
    const productId = Number(item.product_id);
    const current = byProduct.get(productId) ?? {
      product_id: productId,
      product_name: String(item.product_name),
      quantity_sold: 0,
      revenue: 0,
      currency: currencyByOrder.get(Number(item.order_id)) ?? 'BDT',
    };
    current.quantity_sold += Number(item.quantity ?? 0);
    current.revenue += Number(item.total_price ?? 0);
    byProduct.set(productId, current);
  }
  return [...byProduct.values()].sort((a, b) => b.quantity_sold - a.quantity_sold).slice(0, Math.min(limit, 20));
}

export async function getLowStockLicenseProducts(threshold: number): Promise<AdminLowStockLicense[]> {
  const products = await ProductModel.find({ deleted_at: null, product_type: 'license_key' }).lean();
  const out: AdminLowStockLicense[] = [];
  for (const product of products as any[]) {
    const available = await ProductLicensePoolModel.countDocuments({
      product_id: Number(product.id),
      used_at: null,
      deleted_at: null,
    });
    if (available <= threshold) {
      out.push({ product_id: Number(product.id), product_name: String(product.name), available_keys: available });
    }
  }
  return out.sort((a, b) => a.available_keys - b.available_keys);
}

export async function getPendingFulfillmentCount(): Promise<number> {
  return FulfillmentQueueModel.countDocuments({ status: 'pending' });
}

export async function getPendingTicketsCount(): Promise<number> {
  return TicketModel.countDocuments({ status: { $in: ['open', 'answered', 'customer_reply'] } });
}

export async function getCustomersWithOrders(
  limit: number,
  offset: number
): Promise<{ customers: AdminCustomerListItem[]; total: number }> {
  // Get ALL users (not deleted)
  const users = await UserModel.find({ deleted_at: null }).lean();
  
  // Get all orders and group by user_id
  const orderRows = await OrderModel.find({}).sort({ created_at: -1 }).lean();
  const byUser = new Map<number, { count: number; last: unknown }>();
  
  for (const order of orderRows as any[]) {
    const userId = Number(order.user_id);
    const current = byUser.get(userId);
    if (!current) byUser.set(userId, { count: 1, last: order.created_at });
    else current.count += 1;
  }
  
  // Map all users (including those with zero orders)
  const rows = users.map((user: any) => {
    const agg = byUser.get(Number(user.id));
    return {
      user_id: Number(user.id),
      email: String(user.email),
      name: String(user.name ?? ''),
      mobile: user.mobile != null && String(user.mobile).trim() ? String(user.mobile).trim() : null,
      address: user.address != null && String(user.address).trim() ? String(user.address).trim() : null,
      order_count: agg?.count ?? 0,
      last_order_at: agg?.last ? iso(agg.last) : '', // Changed from null to empty string
    };
  }).sort((a, b) => {
    // Sort by last_order_at (empty strings last)
    if (!a.last_order_at) return 1;
    if (!b.last_order_at) return -1;
    return new Date(b.last_order_at).getTime() - new Date(a.last_order_at).getTime();
  });
  
  return { customers: rows.slice(offset, offset + limit), total: rows.length };
}

// export async function getCustomersWithOrders(
//   limit: number,
//   offset: number
// ): Promise<{ customers: AdminCustomerListItem[]; total: number }> {
//   const orderRows = await OrderModel.find({}).sort({ created_at: -1 }).lean();
//   const byUser = new Map<number, { count: number; last: unknown }>();
//   for (const order of orderRows as any[]) {
//     const userId = Number(order.user_id);
//     const current = byUser.get(userId);
//     if (!current) byUser.set(userId, { count: 1, last: order.created_at });
//     else current.count += 1;
//   }
//   const userIds = [...byUser.keys()];
//   const users = await UserModel.find({ id: { $in: userIds }, deleted_at: null }).lean();
//   const rows = users.map((user: any) => {
//     const agg = byUser.get(Number(user.id))!;
//     return {
//       user_id: Number(user.id),
//       email: String(user.email),
//       name: String(user.name ?? ''),
//       mobile: user.mobile != null && String(user.mobile).trim() ? String(user.mobile).trim() : null,
//       address: user.address != null && String(user.address).trim() ? String(user.address).trim() : null,
//       order_count: agg.count,
//       last_order_at: iso(agg.last),
//     };
//   }).sort((a, b) => new Date(b.last_order_at).getTime() - new Date(a.last_order_at).getTime());
//   return { customers: rows.slice(offset, offset + limit), total: rows.length };
// }

export async function getCustomerDetailsAndOrders(userId: number) {
  const user = await UserModel.findOne({ id: userId, deleted_at: null }).lean();
  if (!user) return null;
  const orders = await OrderModel.find({ user_id: userId }).sort({ created_at: -1 }).lean();
  const orderIds = (orders as any[]).map((o) => Number(o.id));
  const [items, payments] = await Promise.all([
    OrderItemModel.find({ order_id: { $in: orderIds } }).lean(),
    PaymentModel.find({ order_id: { $in: orderIds } }).lean(),
  ]);

  const itemsByOrder = new Map<number, any[]>();
  for (const it of items as any[]) {
    const list = itemsByOrder.get(Number(it.order_id)) || [];
    list.push(it);
    itemsByOrder.set(Number(it.order_id), list);
  }

  const paymentByOrder = new Map<number, any>();
  for (const pm of payments as any[]) {
    paymentByOrder.set(Number(pm.order_id), pm);
  }

  const detailedOrders = (orders as any[]).map((o) => {
    const oItems = itemsByOrder.get(Number(o.id)) || [];
    const pm = paymentByOrder.get(Number(o.id));
    return {
      id: Number(o.id),
      order_number: String(o.order_number),
      status: String(o.status),
      payment_status: pm ? String(pm.status) : String(o.payment_status || 'unpaid'),
      gateway: pm ? String(pm.gateway) : String(o.payment_method || '—'),
      subtotal: Number(o.subtotal ?? 0),
      discount: Number(o.discount ?? 0),
      coupon_code: o.coupon_code || o.coupon_name || null,
      total: Number(o.total ?? 0),
      currency: String(o.currency ?? 'BDT'),
      created_at: iso(o.created_at),
      items_count: oItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0),
      items: oItems.map((item) => ({
        id: Number(item.id),
        product_id: Number(item.product_id),
        product_name: String(item.product_name),
        sku: item.sku ?? null,
        quantity: Number(item.quantity ?? 1),
        unit_price: Number(item.unit_price ?? 0),
        total_price: Number(item.total_price ?? 0),
        purchase_selections_summary: item.purchase_selections_summary ?? null,
      })),
    };
  });

  const totalSpent = detailedOrders
    .filter((o) => o.payment_status === 'paid' || o.status === 'complete' || o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0);

  return {
    customer: {
      user_id: Number(user.id),
      email: String(user.email),
      name: String(user.name ?? ''),
      mobile: (user as any).mobile != null && String((user as any).mobile).trim()
        ? String((user as any).mobile).trim()
        : null,
      address: (user as any).address != null && String((user as any).address).trim()
        ? String((user as any).address).trim()
        : null,
      created_at: iso(user.created_at),
      order_count: orders.length,
      total_spent: totalSpent,
      last_order_at: orders.length > 0 ? iso((orders[0] as any).created_at) : null,
    },
    orders: detailedOrders,
  };
}

export async function userHasOrders(userId: number): Promise<boolean> {
  return Boolean(await OrderModel.exists({ user_id: userId }));
}

export async function getCustomerAggregateById(userId: number): Promise<AdminCustomerListItem | null> {
  const user = await UserModel.findOne({ id: userId, deleted_at: null }).lean();
  if (!user) return null;
  const orders = await OrderModel.find({ user_id: userId }).sort({ created_at: -1 }).lean();
  if (orders.length === 0) return null;
  return {
    user_id: Number(user.id),
    email: String(user.email),
    name: String(user.name ?? ''),
    mobile: (user as any).mobile != null && String((user as any).mobile).trim()
      ? String((user as any).mobile).trim()
      : null,
    address: (user as any).address != null && String((user as any).address).trim()
      ? String((user as any).address).trim()
      : null,
    order_count: orders.length,
    last_order_at: iso((orders[0] as any).created_at),
  };
}

export async function softDelete(id: number): Promise<boolean> {
 // console.log('delete id', id);
 const result = await OrderModel.deleteOne({ id });

 return result.deletedCount > 0;
}
