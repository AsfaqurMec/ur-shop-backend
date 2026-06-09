"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextId = nextId;
const mongoose_1 = require("mongoose");
const counterSchema = new mongoose_1.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, required: true, default: 0 },
}, { versionKey: false });
const Counter = mongoose_1.models.Counter || (0, mongoose_1.model)('Counter', counterSchema, 'counters');
async function nextId(name) {
    const row = await Counter.findByIdAndUpdate(name, { $inc: { seq: 1 } }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
    return Number(row?.seq ?? 1);
}
//# sourceMappingURL=counter.js.map