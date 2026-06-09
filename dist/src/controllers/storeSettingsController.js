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
exports.getAdminStoreSettings = getAdminStoreSettings;
exports.updateAdminStoreSettings = updateAdminStoreSettings;
exports.getPublicStoreSettings = getPublicStoreSettings;
exports.uploadStoreLogo = uploadStoreLogo;
const apiResponse_1 = require("../utils/apiResponse");
const storeSettingsService = __importStar(require("../services/storeSettingsService"));
const upload_1 = require("../middlewares/upload");
const cloudinaryService = __importStar(require("../services/cloudinaryService"));
const config_1 = require("../config");
async function getAdminStoreSettings(_req, res) {
    const settings = await storeSettingsService.getStoreSettings();
    return (0, apiResponse_1.sendSuccess)(res, { settings });
}
async function updateAdminStoreSettings(req, res) {
    const patch = req.body;
    const settings = await storeSettingsService.updateStoreSettings(patch);
    return (0, apiResponse_1.sendSuccess)(res, { settings }, 200, 'Store settings updated');
}
async function getPublicStoreSettings(_req, res) {
    const settings = await storeSettingsService.getPublicStoreSettings();
    return (0, apiResponse_1.sendSuccess)(res, { settings });
}
async function uploadStoreLogo(req, res) {
    const file = req.file;
    if (!file) {
        return (0, apiResponse_1.sendError)(res, 'No logo file received. Choose a JPEG, PNG, GIF, or WebP file and ensure the field name is "logo".', 400);
    }
    const relPath = cloudinaryService.isCloudinaryConfigured()
        ? await cloudinaryService.uploadImageBuffer(file, config_1.env.cloudinary.settingsFolder)
        : (0, upload_1.getSettingsLogoRelativePath)(file.filename);
    const origin = `${req.protocol}://${req.get('host')}`;
    const logoUrl = /^https?:\/\//i.test(relPath) ? relPath : `${origin}/${relPath}`;
    return (0, apiResponse_1.sendSuccess)(res, { logo_url: logoUrl, logo_path: relPath }, 201, 'Logo uploaded');
}
//# sourceMappingURL=storeSettingsController.js.map