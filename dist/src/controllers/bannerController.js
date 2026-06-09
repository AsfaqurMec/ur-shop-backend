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
const bannerService = __importStar(require("../services/bannerService"));
const cloudinaryService = __importStar(require("../services/cloudinaryService"));
const config_1 = require("../config");
const upload_1 = require("../middlewares/upload");
async function getUploadedImagePath(file) {
    if (!file)
        return null;
    return cloudinaryService.isCloudinaryConfigured()
        ? cloudinaryService.uploadImageBuffer(file, config_1.env.cloudinary.bannerFolder)
        : (0, upload_1.getBannerImageRelativePath)(file.filename);
}
function bodyBoolean(value, fallback = true) {
    if (value === undefined || value === null || value === '')
        return fallback;
    return value === true || value === 'true' || value === '1' || value === 1;
}
async function create(req, res) {
    const backgroundImage = await getUploadedImagePath(req.file);
    if (!backgroundImage) {
        return (0, apiResponse_1.sendError)(res, 'Background image is required', 400);
    }
    const banner = await bannerService.create({
        background_image: backgroundImage,
        title: req.body.title,
        subtitle: req.body.subtitle,
        buttons: req.body.buttons,
        sort_order: Number(req.body.sort_order ?? 0),
        is_active: bodyBoolean(req.body.is_active, true),
    });
    return (0, apiResponse_1.sendSuccess)(res, { banner }, 201);
}
async function update(req, res) {
    const id = Number(req.params.id);
    const backgroundImage = await getUploadedImagePath(req.file);
    const banner = await bannerService.update(id, {
        ...(backgroundImage ? { background_image: backgroundImage } : {}),
        title: req.body.title,
        subtitle: req.body.subtitle,
        buttons: req.body.buttons,
        sort_order: req.body.sort_order !== undefined ? Number(req.body.sort_order) : undefined,
        is_active: req.body.is_active !== undefined ? bodyBoolean(req.body.is_active, true) : undefined,
    });
    return (0, apiResponse_1.sendSuccess)(res, { banner });
}
async function remove(req, res) {
    const id = Number(req.params.id);
    await bannerService.remove(id);
    return (0, apiResponse_1.sendSuccess)(res, { message: 'Banner deleted' });
}
async function listAdmin(_req, res) {
    const banners = await bannerService.listAdmin();
    return (0, apiResponse_1.sendSuccess)(res, { banners });
}
async function listPublic(_req, res) {
    const banners = await bannerService.listPublic();
    return (0, apiResponse_1.sendSuccess)(res, { banners });
}
//# sourceMappingURL=bannerController.js.map