"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = list;
exports.create = create;
exports.update = update;
exports.remove = remove;
const apiResponse_1 = require("../utils/apiResponse");
const paymentOptionService = __importStar(require("../services/paymentOptionService"));
async function list(req, res) {
    const options = await paymentOptionService.listAllForAdmin();
    return (0, apiResponse_1.sendSuccess)(res, { payment_options: options });
}
async function create(req, res) {
    const body = req.body;
    const option = await paymentOptionService.createOption(body);
    return (0, apiResponse_1.sendSuccess)(res, { payment_option: option }, 201, 'Payment option created');
}
async function update(req, res) {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1)
        return (0, apiResponse_1.sendError)(res, 'Invalid id', 400);
    const option = await paymentOptionService.updateOption(id, req.body);
    return (0, apiResponse_1.sendSuccess)(res, { payment_option: option }, 200, 'Payment option updated');
}
async function remove(req, res) {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1)
        return (0, apiResponse_1.sendError)(res, 'Invalid id', 400);
    await paymentOptionService.removeOption(id);
    return (0, apiResponse_1.sendSuccess)(res, {}, 200, 'Payment option deleted');
}
//# sourceMappingURL=paymentOptionAdminController.js.map