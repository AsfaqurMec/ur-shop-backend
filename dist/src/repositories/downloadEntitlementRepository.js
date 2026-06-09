"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.createMany = createMany;
exports.hasEntitlement = hasEntitlement;
exports.findByOrderItemId = findByOrderItemId;
exports.findEntitlementsForUser = findEntitlementsForUser;
exports.findByIdForUser = findByIdForUser;
const models_1 = require("../database/models");
const counter_1 = require("../database/counter");
async function create(_conn, orderItemId, productFileId) {
    const existing = await models_1.DownloadEntitlementModel.findOne({ order_item_id: orderItemId, product_file_id: productFileId }).lean();
    if (existing)
        return Number(existing.id);
    const id = await (0, counter_1.nextId)('download_entitlements');
    await models_1.DownloadEntitlementModel.create({ id, order_item_id: orderItemId, product_file_id: productFileId, expires_at: null });
    return id;
}
async function createMany(_conn, orderItemId, productFileIds) {
    for (const productFileId of productFileIds)
        await create(null, orderItemId, productFileId);
}
async function hasEntitlement(orderItemId, productFileId) {
    return Boolean(await models_1.DownloadEntitlementModel.exists({ order_item_id: orderItemId, product_file_id: productFileId }));
}
async function findByOrderItemId(orderItemId) {
    const rows = await models_1.DownloadEntitlementModel.find({ order_item_id: orderItemId }).sort({ product_file_id: 1 }).lean();
    return rows.map((r) => ({ product_file_id: Number(r.product_file_id) }));
}
async function findEntitlementsForUser(userId) {
    const orders = await models_1.OrderModel.find({ user_id: userId }).lean();
    const orderById = new Map(orders.map((o) => [Number(o.id), o]));
    const orderIds = [...orderById.keys()];
    const orderItems = await models_1.OrderItemModel.find({ order_id: { $in: orderIds } }).lean();
    const itemById = new Map(orderItems.map((i) => [Number(i.id), i]));
    const ents = await models_1.DownloadEntitlementModel.find({ order_item_id: { $in: [...itemById.keys()] } }).sort({ created_at: -1 }).lean();
    const files = await models_1.ProductFileModel.find({ id: { $in: ents.map((e) => Number(e.product_file_id)) } }).lean();
    const fileById = new Map(files.map((f) => [Number(f.id), f]));
    const out = [];
    for (const ent of ents) {
        const item = itemById.get(Number(ent.order_item_id));
        const order = orderById.get(Number(item?.order_id));
        const file = fileById.get(Number(ent.product_file_id));
        if (!item || !order || !file)
            continue;
        const downloadCount = await models_1.DownloadModel.countDocuments({
            order_item_id: Number(ent.order_item_id),
            product_file_id: Number(ent.product_file_id),
        });
        out.push({
            entitlement_id: Number(ent.id),
            order_item_id: Number(ent.order_item_id),
            order_id: Number(item.order_id),
            order_number: String(order.order_number),
            product_id: Number(item.product_id),
            product_name: String(item.product_name),
            product_file_id: Number(ent.product_file_id),
            file_name: String(file.file_name),
            file_size: file.file_size != null ? Number(file.file_size) : null,
            download_limit: file.download_limit != null ? Number(file.download_limit) : null,
            expires_at: ent.expires_at ? new Date(ent.expires_at) : null,
            created_at: ent.created_at ? new Date(ent.created_at) : new Date(),
            download_count: downloadCount,
        });
    }
    return out;
}
async function findByIdForUser(entitlementId, userId) {
    const ent = await models_1.DownloadEntitlementModel.findOne({ id: entitlementId }).lean();
    if (!ent)
        return null;
    const item = await models_1.OrderItemModel.findOne({ id: Number(ent.order_item_id) }).lean();
    if (!item)
        return null;
    const order = await models_1.OrderModel.findOne({ id: Number(item.order_id), user_id: userId }).lean();
    if (!order)
        return null;
    return {
        id: Number(ent.id),
        order_item_id: Number(ent.order_item_id),
        product_file_id: Number(ent.product_file_id),
        user_id: Number(order.user_id),
        expires_at: ent.expires_at ? new Date(ent.expires_at) : null,
    };
}
//# sourceMappingURL=downloadEntitlementRepository.js.map