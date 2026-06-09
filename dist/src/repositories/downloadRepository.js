"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.countByOrderItemAndFile = countByOrderItemAndFile;
const models_1 = require("../database/models");
const counter_1 = require("../database/counter");
async function create(_conn, data) {
    const id = await (0, counter_1.nextId)('downloads');
    await models_1.DownloadModel.create({ id, ...data, ip: data.ip ?? null, user_agent: data.user_agent ?? null });
    return id;
}
async function countByOrderItemAndFile(orderItemId, productFileId) {
    return models_1.DownloadModel.countDocuments({ order_item_id: orderItemId, product_file_id: productFileId });
}
//# sourceMappingURL=downloadRepository.js.map