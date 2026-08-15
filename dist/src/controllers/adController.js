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
exports.listAdmin = listAdmin;
exports.listPublic = listPublic;
const apiResponse_1 = require("../utils/apiResponse");
const service = __importStar(require("../services/adService"));
const cloudinary = __importStar(require("../services/cloudinaryService"));
const config_1 = require("../config");
const upload_1 = require("../middlewares/upload");
async function image(file) { return file ? (cloudinary.isCloudinaryConfigured() ? cloudinary.uploadImageBuffer(file, config_1.env.cloudinary.bannerFolder) : (0, upload_1.getBannerImageRelativePath)(file.filename)) : null; }
const active = (value) => value === true || value === 'true' || value === '1';
async function create(req, res) { const path = await image(req.file); if (!path)
    return (0, apiResponse_1.sendError)(res, 'Ad image is required', 400); return (0, apiResponse_1.sendSuccess)(res, { ad: await service.create(path, req.body.is_active === undefined || active(req.body.is_active)) }, 201); }
async function update(req, res) { const path = await image(req.file); return (0, apiResponse_1.sendSuccess)(res, { ad: await service.update(Number(req.params.id), { ...(path ? { image_path: path } : {}), ...(req.body.is_active !== undefined ? { is_active: active(req.body.is_active) } : {}) }) }); }
async function remove(req, res) { await service.remove(Number(req.params.id)); return (0, apiResponse_1.sendSuccess)(res, { message: 'Ad deleted' }); }
async function listAdmin(_req, res) { return (0, apiResponse_1.sendSuccess)(res, { ads: await service.listAdmin() }); }
async function listPublic(_req, res) { return (0, apiResponse_1.sendSuccess)(res, { ads: await service.listPublic() }); }
//# sourceMappingURL=adController.js.map