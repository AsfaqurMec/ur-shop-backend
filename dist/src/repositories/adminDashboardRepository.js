"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardSummary = getDashboardSummary;
exports.getSalesSummary = getSalesSummary;
exports.getOrdersByStatus = getOrdersByStatus;
exports.getRecentOrders = getRecentOrders;
exports.updateOrderStatus = updateOrderStatus;
exports.updateOrderPaymentStatus = updateOrderPaymentStatus;
exports.getPaidRevenueHistory = getPaidRevenueHistory;
exports.getOrderListItemById = getOrderListItemById;
exports.getRecentPayments = getRecentPayments;
exports.getTopProducts = getTopProducts;
exports.getLowStockLicenseProducts = getLowStockLicenseProducts;
exports.getPendingFulfillmentCount = getPendingFulfillmentCount;
exports.getPendingTicketsCount = getPendingTicketsCount;
exports.getCustomersWithOrders = getCustomersWithOrders;
exports.getCustomerDetailsAndOrders = getCustomerDetailsAndOrders;
exports.userHasOrders = userHasOrders;
exports.getCustomerAggregateById = getCustomerAggregateById;
exports.softDelete = softDelete;
const models_1 = require("../database/models");
function iso(v) {
    return (v ? new Date(v) : new Date()).toISOString();
}
async function getDashboardSummary() {
    const [ordersTotal, ordersPaid, paidOrders, totalUsers, pendingFulfillment, pendingTickets] = await Promise.all([
        models_1.OrderModel.countDocuments({}),
        models_1.OrderModel.countDocuments({ payment_status: 'paid' }),
        models_1.OrderModel.find({ payment_status: 'paid' }).lean(),
        models_1.UserModel.countDocuments({ deleted_at: null }),
        models_1.FulfillmentQueueModel.countDocuments({ status: 'pending' }),
        models_1.TicketModel.countDocuments({ status: { $in: ['open', 'answered', 'customer_reply'] } }),
    ]);
    const revenueTotal = paidOrders.reduce((sum, p) => sum + Number(p.total ?? 0), 0);
    return {
        orders_total: ordersTotal,
        orders_paid: ordersPaid,
        revenue_total: Math.round(revenueTotal * 100) / 100,
        customers_count: totalUsers,
        pending_fulfillment_count: pendingFulfillment,
        pending_tickets_count: pendingTickets,
    };
}
async function getSalesSummary() {
    const payments = await models_1.OrderModel.find({ payment_status: 'paid' }).lean();
    return {
        total_revenue: payments.reduce((sum, p) => sum + p.total, 0),
        total_orders_paid: new Set(payments.map((p) => Number(p.order_id))).size,
        currency: String(payments[0]?.currency || 'BDT'),
    };
}
function getDateRangeFilter(params) {
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
async function getOrdersByStatus(params) {
    const range = getDateRangeFilter(params);
    const match = {};
    if (range) {
        match.created_at = { $gte: range.start, $lte: range.end };
    }
    const [statusRows, paidOrders, unpaidOrders] = await Promise.all([
        models_1.OrderModel.aggregate([
            ...(Object.keys(match).length ? [{ $match: match }] : []),
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),
        models_1.OrderModel.find({ ...match, payment_status: 'paid' }).lean(),
        models_1.OrderModel.find({ ...match, payment_status: { $ne: 'paid' } }).lean(),
    ]);
    const byStatus = statusRows.map((r) => ({
        status: String(r._id),
        count: Number(r.count),
    }));
    const paidCount = paidOrders.length;
    const unpaidCount = unpaidOrders.length;
    const paidRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total ?? 0), 0);
    const unpaidRevenue = unpaidOrders.reduce((sum, o) => sum + Number(o.total ?? 0), 0);
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
function recentOrder(row, customerName) {
    return {
        id: Number(row.id),
        order_number: String(row.order_number),
        status: String(row.status),
        payment_status: String(row.payment_status || 'unpaid'),
        total: Number(row.total ?? 0),
        currency: String(row.currency ?? 'BDT'),
        user_id: Number(row.user_id),
        shipping_mobile: row.shipping_mobile != null && String(row.shipping_mobile).trim()
            ? String(row.shipping_mobile).trim()
            : null,
        customer_name: customerName?.trim() || null,
        created_at: iso(row.created_at),
    };
}
async function getRecentOrders(limit, offset, status) {
    const query = status ? { status } : {};
    const [total, rows] = await Promise.all([
        models_1.OrderModel.countDocuments(query),
        models_1.OrderModel.find(query).sort({ created_at: -1 }).skip(offset).limit(limit).lean(),
    ]);
    const userIds = [...new Set(rows.map((r) => Number(r.user_id)))];
    const users = await models_1.UserModel.find({ id: { $in: userIds }, deleted_at: null }).lean();
    const nameByUserId = new Map(users.map((u) => [Number(u.id), String(u.name ?? '')]));
    return {
        orders: rows.map((r) => recentOrder(r, nameByUserId.get(Number(r.user_id)) ?? null)),
        total,
    };
}
async function updateOrderStatus(orderId, status) {
    const result = await models_1.OrderModel.updateOne({ id: orderId }, { $set: { status } });
    return result.modifiedCount > 0;
}
async function updateOrderPaymentStatus(orderId, paymentStatus) {
    const [orderRes] = await Promise.all([
        models_1.OrderModel.updateOne({ id: orderId }, { $set: { payment_status: paymentStatus } }),
        models_1.PaymentModel.updateMany({ order_id: orderId }, { $set: { status: paymentStatus === 'paid' ? 'completed' : 'pending' } }),
    ]);
    return orderRes.matchedCount > 0;
}
async function getPaidRevenueHistory(params) {
    const range = getDateRangeFilter(params) || {
        start: (() => {
            const d = new Date();
            d.setDate(d.getDate() - 13);
            d.setHours(0, 0, 0, 0);
            return d;
        })(),
        end: new Date(),
    };
    const rows = await models_1.OrderModel.aggregate([
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
    const values = new Map(rows.map((row) => [String(row._id), Number(row.revenue ?? 0)]));
    const out = [];
    const cur = new Date(range.start);
    while (cur <= range.end) {
        const key = cur.toISOString().slice(0, 10);
        out.push({ date: key, revenue: values.get(key) ?? 0 });
        cur.setDate(cur.getDate() + 1);
    }
    return out;
}
async function getOrderListItemById(orderId) {
    const row = await models_1.OrderModel.findOne({ id: orderId }).lean();
    if (!row)
        return null;
    const user = await models_1.UserModel.findOne({ id: Number(row.user_id), deleted_at: null }).lean();
    return recentOrder(row, user ? String(user.name ?? '') : null);
}
async function getRecentPayments(limit) {
    const payments = await models_1.PaymentModel.find({}).sort({ created_at: -1 }).limit(limit).lean();
    const orderIds = payments.map((p) => Number(p.order_id));
    const orders = await models_1.OrderModel.find({ id: { $in: orderIds } }).lean();
    const orderById = new Map(orders.map((o) => [Number(o.id), o]));
    return payments.flatMap((p) => {
        const order = orderById.get(Number(p.order_id));
        if (!order)
            return [];
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
async function getTopProducts(limit) {
    const paidOrders = await models_1.OrderModel.find({ status: { $in: ['paid', 'processing', 'completed'] } }).select({ id: 1, currency: 1 }).lean();
    const orderIds = paidOrders.map((o) => Number(o.id));
    const currencyByOrder = new Map(paidOrders.map((o) => [Number(o.id), String(o.currency ?? 'BDT')]));
    const items = await models_1.OrderItemModel.find({ order_id: { $in: orderIds } }).lean();
    const byProduct = new Map();
    for (const item of items) {
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
async function getLowStockLicenseProducts(threshold) {
    const products = await models_1.ProductModel.find({ deleted_at: null, product_type: 'license_key' }).lean();
    const out = [];
    for (const product of products) {
        const available = await models_1.ProductLicensePoolModel.countDocuments({
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
async function getPendingFulfillmentCount() {
    return models_1.FulfillmentQueueModel.countDocuments({ status: 'pending' });
}
async function getPendingTicketsCount() {
    return models_1.TicketModel.countDocuments({ status: { $in: ['open', 'answered', 'customer_reply'] } });
}
async function getCustomersWithOrders(limit, offset) {
    // Get ALL users (not deleted)
    const users = await models_1.UserModel.find({ deleted_at: null }).lean();
    // Get all orders and group by user_id
    const orderRows = await models_1.OrderModel.find({}).sort({ created_at: -1 }).lean();
    const byUser = new Map();
    for (const order of orderRows) {
        const userId = Number(order.user_id);
        const current = byUser.get(userId);
        if (!current)
            byUser.set(userId, { count: 1, last: order.created_at });
        else
            current.count += 1;
    }
    // Map all users (including those with zero orders)
    const rows = users.map((user) => {
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
        if (!a.last_order_at)
            return 1;
        if (!b.last_order_at)
            return -1;
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
async function getCustomerDetailsAndOrders(userId) {
    const user = await models_1.UserModel.findOne({ id: userId, deleted_at: null }).lean();
    if (!user)
        return null;
    const orders = await models_1.OrderModel.find({ user_id: userId }).sort({ created_at: -1 }).lean();
    const orderIds = orders.map((o) => Number(o.id));
    const [items, payments] = await Promise.all([
        models_1.OrderItemModel.find({ order_id: { $in: orderIds } }).lean(),
        models_1.PaymentModel.find({ order_id: { $in: orderIds } }).lean(),
    ]);
    const itemsByOrder = new Map();
    for (const it of items) {
        const list = itemsByOrder.get(Number(it.order_id)) || [];
        list.push(it);
        itemsByOrder.set(Number(it.order_id), list);
    }
    const paymentByOrder = new Map();
    for (const pm of payments) {
        paymentByOrder.set(Number(pm.order_id), pm);
    }
    const detailedOrders = orders.map((o) => {
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
            mobile: user.mobile != null && String(user.mobile).trim()
                ? String(user.mobile).trim()
                : null,
            address: user.address != null && String(user.address).trim()
                ? String(user.address).trim()
                : null,
            created_at: iso(user.created_at),
            order_count: orders.length,
            total_spent: totalSpent,
            last_order_at: orders.length > 0 ? iso(orders[0].created_at) : null,
        },
        orders: detailedOrders,
    };
}
async function userHasOrders(userId) {
    return Boolean(await models_1.OrderModel.exists({ user_id: userId }));
}
async function getCustomerAggregateById(userId) {
    const user = await models_1.UserModel.findOne({ id: userId, deleted_at: null }).lean();
    if (!user)
        return null;
    const orders = await models_1.OrderModel.find({ user_id: userId }).sort({ created_at: -1 }).lean();
    if (orders.length === 0)
        return null;
    return {
        user_id: Number(user.id),
        email: String(user.email),
        name: String(user.name ?? ''),
        mobile: user.mobile != null && String(user.mobile).trim()
            ? String(user.mobile).trim()
            : null,
        address: user.address != null && String(user.address).trim()
            ? String(user.address).trim()
            : null,
        order_count: orders.length,
        last_order_at: iso(orders[0].created_at),
    };
}
async function softDelete(id) {
    // console.log('delete id', id);
    const result = await models_1.OrderModel.deleteOne({ id });
    return result.deletedCount > 0;
}
//# sourceMappingURL=adminDashboardRepository.js.map