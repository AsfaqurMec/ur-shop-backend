"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadCategoryImage = exports.uploadCategoryImages = exports.uploadBannerImage = exports.uploadSettingsLogo = exports.uploadTicketAttachment = exports.uploadProductSizeChartImage = exports.uploadReviewImage = exports.uploadPaymentProof = exports.uploadProductFile = exports.uploadProductImages = exports.uploadProductImage = void 0;
exports.getProductImageRelativePath = getProductImageRelativePath;
exports.getProductFileRelativePath = getProductFileRelativePath;
exports.getPaymentProofRelativePath = getPaymentProofRelativePath;
exports.getProductFileAbsolutePath = getProductFileAbsolutePath;
exports.getPaymentProofAbsolutePath = getPaymentProofAbsolutePath;
exports.getTicketAttachmentRelativePath = getTicketAttachmentRelativePath;
exports.getTicketAttachmentAbsolutePath = getTicketAttachmentAbsolutePath;
exports.getSettingsLogoRelativePath = getSettingsLogoRelativePath;
exports.getBannerImageRelativePath = getBannerImageRelativePath;
exports.getReviewImageRelativePath = getReviewImageRelativePath;
exports.getCategoryImageRelativePath = getCategoryImageRelativePath;
exports.getCategoryBannerRelativePath = getCategoryBannerRelativePath;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const config_1 = require("../config");
const cloudinaryService_1 = require("../services/cloudinaryService");
const errorHandler_1 = require("./errorHandler");
const UPLOAD_BASE = (0, config_1.getUploadAbsoluteBase)();
const PRODUCT_IMAGES_DIR = path_1.default.join(UPLOAD_BASE, 'products', 'images');
const PRODUCT_FILES_DIR = path_1.default.join(UPLOAD_BASE, 'products', 'files');
const PAYMENT_PROOFS_DIR = path_1.default.join(UPLOAD_BASE, 'payments', 'proofs');
const TICKET_ATTACHMENTS_DIR = path_1.default.join(UPLOAD_BASE, 'tickets', 'attachments');
const SETTINGS_LOGOS_DIR = path_1.default.join(UPLOAD_BASE, 'settings', 'logos');
const BANNER_IMAGES_DIR = path_1.default.join(UPLOAD_BASE, 'banners', 'images');
const CATEGORY_IMAGES_DIR = path_1.default.join(UPLOAD_BASE, 'categories', 'images');
const CATEGORY_BANNERS_DIR = path_1.default.join(UPLOAD_BASE, 'categories', 'banners');
const REVIEW_IMAGES_DIR = path_1.default.join(UPLOAD_BASE, 'reviews', 'images');
const maxSizeBytes = config_1.env.upload.maxFileSizeMb * 1024 * 1024;
function ensureDir(dir) {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
}
function sanitizeFileName(name) {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_').slice(0, 200) || 'file';
}
function productImageStorage() {
    ensureDir(PRODUCT_IMAGES_DIR);
    return multer_1.default.diskStorage({
        destination: (_req, _file, cb) => cb(null, PRODUCT_IMAGES_DIR),
        filename: (_req, file, cb) => {
            const ext = path_1.default.extname(file.originalname).toLowerCase() || '.jpg';
            const base = sanitizeFileName(path_1.default.basename(file.originalname, path_1.default.extname(file.originalname)));
            const name = `${base}-${Date.now()}${ext}`;
            cb(null, name);
        },
    });
}
function productFileStorage() {
    ensureDir(PRODUCT_FILES_DIR);
    return multer_1.default.diskStorage({
        destination: (_req, _file, cb) => cb(null, PRODUCT_FILES_DIR),
        filename: (_req, file, cb) => {
            const ext = path_1.default.extname(file.originalname).toLowerCase() || '';
            const base = sanitizeFileName(path_1.default.basename(file.originalname, path_1.default.extname(file.originalname)));
            const name = `${base}-${Date.now()}${ext}`;
            cb(null, name);
        },
    });
}
const ALLOWED_IMAGE_MIMES = new Set([
    'image/jpeg',
    'image/jpg',
    'image/pjpeg',
    'image/png',
    'image/gif',
    'image/webp',
]);
const ALLOWED_IMAGE_EXTS = new Set([
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
]);
const imageFileFilter = (_req, file, cb) => {
    const mime = (file.mimetype || '').toLowerCase();
    const ext = path_1.default.extname(file.originalname || '').toLowerCase();
    if (ALLOWED_IMAGE_MIMES.has(mime) && ALLOWED_IMAGE_EXTS.has(ext)) {
        cb(null, true);
    }
    else {
        cb(new errorHandler_1.AppError(400, 'Only image files (.jpg, .jpeg, .png, .gif, .webp) are allowed'));
    }
};
const ALLOWED_TICKET_EXTS = new Set([
    '.pdf',
    '.png',
    '.jpg',
    '.jpeg',
    '.webp',
    '.txt',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.zip',
    '.csv',
]);
const ticketAttachmentFileFilter = (_req, file, cb) => {
    const ext = path_1.default.extname(file.originalname || '').toLowerCase();
    if (ALLOWED_TICKET_EXTS.has(ext)) {
        cb(null, true);
    }
    else {
        cb(new errorHandler_1.AppError(400, 'Invalid attachment file type. Allowed formats: PDF, PNG, JPG, WEBP, TXT, DOC, DOCX, XLS, XLSX, CSV, ZIP.'));
    }
};
const anyFileFilter = (_req, _file, cb) => {
    cb(null, true);
};
exports.uploadProductImage = (0, multer_1.default)({
    storage: (0, cloudinaryService_1.isCloudinaryConfigured)() ? multer_1.default.memoryStorage() : productImageStorage(),
    limits: { fileSize: maxSizeBytes },
    fileFilter: imageFileFilter,
}).single('image');
exports.uploadProductImages = (0, multer_1.default)({
    storage: (0, cloudinaryService_1.isCloudinaryConfigured)() ? multer_1.default.memoryStorage() : productImageStorage(),
    limits: { fileSize: maxSizeBytes },
    fileFilter: imageFileFilter,
}).array('images', 10);
exports.uploadProductFile = (0, multer_1.default)({
    storage: productFileStorage(),
    limits: { fileSize: maxSizeBytes },
    fileFilter: anyFileFilter,
}).single('file');
function paymentProofStorage() {
    ensureDir(PAYMENT_PROOFS_DIR);
    return multer_1.default.diskStorage({
        destination: (_req, _file, cb) => cb(null, PAYMENT_PROOFS_DIR),
        filename: (_req, file, cb) => {
            const ext = path_1.default.extname(file.originalname).toLowerCase() || '.jpg';
            const base = sanitizeFileName(path_1.default.basename(file.originalname, path_1.default.extname(file.originalname)));
            const name = `${base}-${Date.now()}${ext}`;
            cb(null, name);
        },
    });
}
exports.uploadPaymentProof = (0, multer_1.default)({
    storage: (0, cloudinaryService_1.isCloudinaryConfigured)() ? multer_1.default.memoryStorage() : paymentProofStorage(),
    limits: { fileSize: maxSizeBytes },
    fileFilter: imageFileFilter,
}).single('proof');
function reviewImageStorage() {
    ensureDir(REVIEW_IMAGES_DIR);
    return multer_1.default.diskStorage({
        destination: (_req, _file, cb) => cb(null, REVIEW_IMAGES_DIR),
        filename: (_req, file, cb) => {
            const ext = path_1.default.extname(file.originalname).toLowerCase() || '.jpg';
            const base = sanitizeFileName(path_1.default.basename(file.originalname, path_1.default.extname(file.originalname)));
            cb(null, `${base}-${Date.now()}${ext}`);
        },
    });
}
/** One optional customer-review photo, sent in the multipart field named `image`. */
exports.uploadReviewImage = (0, multer_1.default)({
    storage: (0, cloudinaryService_1.isCloudinaryConfigured)() ? multer_1.default.memoryStorage() : reviewImageStorage(),
    limits: { fileSize: maxSizeBytes },
    fileFilter: imageFileFilter,
}).single('image');
/** One optional size chart image, kept with other product imagery. */
exports.uploadProductSizeChartImage = (0, multer_1.default)({
    storage: (0, cloudinaryService_1.isCloudinaryConfigured)() ? multer_1.default.memoryStorage() : productImageStorage(),
    limits: { fileSize: maxSizeBytes },
    fileFilter: imageFileFilter,
}).single('size_chart_image');
/** Relative path from upload base for storage in DB */
function getProductImageRelativePath(filename) {
    return path_1.default.join('products', 'images', filename).replace(/\\/g, '/');
}
function getProductFileRelativePath(filename) {
    return path_1.default.join('products', 'files', filename).replace(/\\/g, '/');
}
function getPaymentProofRelativePath(filename) {
    return path_1.default.join('payments', 'proofs', filename).replace(/\\/g, '/');
}
/**
 * Validates and normalizes relative paths against UPLOAD_BASE to prevent directory traversal attacks.
 */
function assertSafeUploadPath(relativePath) {
    if (!relativePath || typeof relativePath !== 'string') {
        throw new errorHandler_1.AppError(400, 'Invalid file path');
    }
    const resolvedBase = path_1.default.resolve(UPLOAD_BASE);
    const resolvedPath = path_1.default.isAbsolute(relativePath)
        ? path_1.default.resolve(relativePath)
        : path_1.default.resolve(UPLOAD_BASE, relativePath);
    const normalizedBase = path_1.default.normalize(resolvedBase);
    const normalizedPath = path_1.default.normalize(resolvedPath);
    if (!normalizedPath.startsWith(normalizedBase + path_1.default.sep) && normalizedPath !== normalizedBase) {
        throw new errorHandler_1.AppError(403, 'Invalid file path: path traversal detected');
    }
    return normalizedPath;
}
/** Absolute path for a product file from DB file_path (relative to upload base). */
function getProductFileAbsolutePath(relativePath) {
    return assertSafeUploadPath(relativePath);
}
/** Absolute path for a payment proof file from DB file_path (relative to upload base). */
function getPaymentProofAbsolutePath(relativePath) {
    return assertSafeUploadPath(relativePath);
}
function ticketAttachmentStorage() {
    ensureDir(TICKET_ATTACHMENTS_DIR);
    return multer_1.default.diskStorage({
        destination: (_req, _file, cb) => cb(null, TICKET_ATTACHMENTS_DIR),
        filename: (_req, file, cb) => {
            const ext = path_1.default.extname(file.originalname).toLowerCase() || '';
            const base = sanitizeFileName(path_1.default.basename(file.originalname, path_1.default.extname(file.originalname)));
            const name = `${base}-${Date.now()}${ext}`;
            cb(null, name);
        },
    });
}
exports.uploadTicketAttachment = (0, multer_1.default)({
    storage: ticketAttachmentStorage(),
    limits: { fileSize: maxSizeBytes },
    fileFilter: ticketAttachmentFileFilter,
}).single('attachment');
function settingsLogoStorage() {
    ensureDir(SETTINGS_LOGOS_DIR);
    return multer_1.default.diskStorage({
        destination: (_req, _file, cb) => cb(null, SETTINGS_LOGOS_DIR),
        filename: (_req, file, cb) => {
            const ext = path_1.default.extname(file.originalname).toLowerCase() || '.png';
            const base = sanitizeFileName(path_1.default.basename(file.originalname, path_1.default.extname(file.originalname)));
            const name = `${base}-${Date.now()}${ext}`;
            cb(null, name);
        },
    });
}
exports.uploadSettingsLogo = (0, multer_1.default)({
    storage: (0, cloudinaryService_1.isCloudinaryConfigured)() ? multer_1.default.memoryStorage() : settingsLogoStorage(),
    limits: { fileSize: maxSizeBytes },
    fileFilter: imageFileFilter,
}).single('logo');
function bannerImageStorage() {
    ensureDir(BANNER_IMAGES_DIR);
    return multer_1.default.diskStorage({
        destination: (_req, _file, cb) => cb(null, BANNER_IMAGES_DIR),
        filename: (_req, file, cb) => {
            const ext = path_1.default.extname(file.originalname).toLowerCase() || '.jpg';
            const base = sanitizeFileName(path_1.default.basename(file.originalname, path_1.default.extname(file.originalname)));
            const name = `${base}-${Date.now()}${ext}`;
            cb(null, name);
        },
    });
}
exports.uploadBannerImage = (0, multer_1.default)({
    storage: (0, cloudinaryService_1.isCloudinaryConfigured)() ? multer_1.default.memoryStorage() : bannerImageStorage(),
    limits: { fileSize: maxSizeBytes },
    fileFilter: imageFileFilter,
}).single('background_image');
/** Relative path for ticket attachment (store in DB). */
function getTicketAttachmentRelativePath(filename) {
    return path_1.default.join('tickets', 'attachments', filename).replace(/\\/g, '/');
}
/** Absolute path for ticket attachment (stream download). */
function getTicketAttachmentAbsolutePath(relativePath) {
    return assertSafeUploadPath(relativePath);
}
/** Relative path for settings logo (store in DB). */
function getSettingsLogoRelativePath(filename) {
    return path_1.default.join('settings', 'logos', filename).replace(/\\/g, '/');
}
function getBannerImageRelativePath(filename) {
    return path_1.default.join('banners', 'images', filename).replace(/\\/g, '/');
}
function getReviewImageRelativePath(filename) {
    return path_1.default.join('reviews', 'images', filename).replace(/\\/g, '/');
}
function categoryFilesStorage() {
    ensureDir(CATEGORY_IMAGES_DIR);
    ensureDir(CATEGORY_BANNERS_DIR);
    return multer_1.default.diskStorage({
        destination: (_req, file, cb) => {
            cb(null, file.fieldname === 'banner_image' ? CATEGORY_BANNERS_DIR : CATEGORY_IMAGES_DIR);
        },
        filename: (_req, file, cb) => {
            const ext = path_1.default.extname(file.originalname).toLowerCase() || '.jpg';
            const base = sanitizeFileName(path_1.default.basename(file.originalname, path_1.default.extname(file.originalname)));
            const name = `${base}-${Date.now()}${ext}`;
            cb(null, name);
        },
    });
}
exports.uploadCategoryImages = (0, multer_1.default)({
    storage: (0, cloudinaryService_1.isCloudinaryConfigured)() ? multer_1.default.memoryStorage() : categoryFilesStorage(),
    limits: { fileSize: maxSizeBytes },
    fileFilter: imageFileFilter,
}).fields([
    { name: 'image', maxCount: 1 },
    { name: 'banner_image', maxCount: 1 },
]);
/** @deprecated use uploadCategoryImages */
exports.uploadCategoryImage = exports.uploadCategoryImages;
function getCategoryImageRelativePath(filename) {
    return path_1.default.join('categories', 'images', filename).replace(/\\/g, '/');
}
function getCategoryBannerRelativePath(filename) {
    return path_1.default.join('categories', 'banners', filename).replace(/\\/g, '/');
}
//# sourceMappingURL=upload.js.map