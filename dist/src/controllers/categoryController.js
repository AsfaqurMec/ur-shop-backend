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
exports.create = create;
exports.update = update;
exports.remove = remove;
exports.list = list;
exports.getBySlug = getBySlug;
const apiResponse_1 = require("../utils/apiResponse");
const categoryService = __importStar(require("../services/categoryService"));
async function create(req, res) {
    const { name, slug, description, parent_id, sort_order } = req.body;
    const category = await categoryService.create({
        name,
        slug,
        description,
        parent_id: parent_id ?? undefined,
        sort_order,
    });
    return (0, apiResponse_1.sendSuccess)(res, { category }, 201);
}
async function update(req, res) {
    const id = Number(req.params.id);
    const { name, slug, description, parent_id, sort_order } = req.body;
    const category = await categoryService.update(id, {
        name,
        slug,
        description,
        parent_id,
        sort_order,
    });
    return (0, apiResponse_1.sendSuccess)(res, { category });
}
async function remove(req, res) {
    const id = Number(req.params.id);
    await categoryService.remove(id);
    return (0, apiResponse_1.sendSuccess)(res, { message: 'Category deleted' });
}
async function list(req, res) {
    const nested = req.query.nested === '1' || req.query.nested === 'true';
    if (nested) {
        const categories = await categoryService.list(true);
        return (0, apiResponse_1.sendSuccess)(res, { categories });
    }
    const hasPage = req.query.page != null && req.query.page !== '';
    const hasLimit = req.query.limit != null && req.query.limit !== '';
    if (hasPage || hasLimit) {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const result = await categoryService.listPaginated(page, limit);
        return (0, apiResponse_1.sendSuccess)(res, result);
    }
    const categories = await categoryService.list(false);
    return (0, apiResponse_1.sendSuccess)(res, { categories });
}
async function getBySlug(req, res) {
    const slug = req.params.slug;
    const category = await categoryService.getBySlug(slug);
    return (0, apiResponse_1.sendSuccess)(res, { category });
}
//# sourceMappingURL=categoryController.js.map