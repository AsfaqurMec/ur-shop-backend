"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCloudinaryConfigured = isCloudinaryConfigured;
exports.uploadImageBuffer = uploadImageBuffer;
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../config");
const errorHandler_1 = require("../middlewares/errorHandler");
function isCloudinaryConfigured() {
    return Boolean(config_1.env.cloudinary.cloudName && config_1.env.cloudinary.apiKey && config_1.env.cloudinary.apiSecret);
}
async function uploadImageBuffer(file, folder) {
    if (!isCloudinaryConfigured()) {
        throw new errorHandler_1.AppError(500, 'Cloudinary is not configured');
    }
    if (!file.buffer?.length) {
        throw new errorHandler_1.AppError(400, 'No image data received');
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${config_1.env.cloudinary.apiSecret}`;
    const signature = crypto_1.default.createHash('sha1').update(paramsToSign).digest('hex');
    const blob = new Blob([file.buffer], { type: file.mimetype || 'application/octet-stream' });
    const form = new FormData();
    form.append('file', blob, file.originalname || 'upload');
    form.append('api_key', config_1.env.cloudinary.apiKey);
    form.append('timestamp', String(timestamp));
    form.append('folder', folder);
    form.append('signature', signature);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${config_1.env.cloudinary.cloudName}/image/upload`, {
        method: 'POST',
        body: form,
    });
    const data = (await res.json().catch(() => null));
    if (!res.ok || !data?.secure_url) {
        throw new errorHandler_1.AppError(res.status >= 400 && res.status < 500 ? 400 : 502, data?.error?.message || 'Cloudinary upload failed');
    }
    return data.secure_url;
}
//# sourceMappingURL=cloudinaryService.js.map