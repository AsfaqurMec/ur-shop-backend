"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.findByToken = findByToken;
exports.incrementUseCount = incrementUseCount;
const models_1 = require("../database/models");
const counter_1 = require("../database/counter");
function row(doc) {
    return {
        id: Number(doc.id),
        token: String(doc.token),
        entitlement_id: Number(doc.entitlement_id),
        user_id: Number(doc.user_id),
        expires_at: doc.expires_at ? new Date(doc.expires_at) : new Date(),
        max_uses: Number(doc.max_uses ?? 1),
        use_count: Number(doc.use_count ?? 0),
        created_at: doc.created_at ? new Date(doc.created_at) : new Date(),
    };
}
async function create(_conn, data) {
    const id = await (0, counter_1.nextId)('download_tokens');
    await models_1.DownloadTokenModel.create({ id, ...data, use_count: 0 });
    return id;
}
async function findByToken(token) {
    const doc = await models_1.DownloadTokenModel.findOne({ token }).lean();
    return doc ? row(doc) : null;
}
async function incrementUseCount(_conn, tokenId) {
    const result = await models_1.DownloadTokenModel.updateOne({ id: tokenId, $expr: { $lt: ['$use_count', '$max_uses'] } }, { $inc: { use_count: 1 } });
    return result.modifiedCount > 0;
}
//# sourceMappingURL=downloadTokenRepository.js.map