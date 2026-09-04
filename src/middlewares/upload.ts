import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { Request } from 'express';
import { env, getUploadAbsoluteBase } from '../config';
import { isCloudinaryConfigured } from '../services/cloudinaryService';
import { AppError } from './errorHandler';

const UPLOAD_BASE = getUploadAbsoluteBase();
const PRODUCT_IMAGES_DIR = path.join(UPLOAD_BASE, 'products', 'images');
const PRODUCT_FILES_DIR = path.join(UPLOAD_BASE, 'products', 'files');
const PAYMENT_PROOFS_DIR = path.join(UPLOAD_BASE, 'payments', 'proofs');
const TICKET_ATTACHMENTS_DIR = path.join(UPLOAD_BASE, 'tickets', 'attachments');
const SETTINGS_LOGOS_DIR = path.join(UPLOAD_BASE, 'settings', 'logos');
const BANNER_IMAGES_DIR = path.join(UPLOAD_BASE, 'banners', 'images');
const CATEGORY_IMAGES_DIR = path.join(UPLOAD_BASE, 'categories', 'images');
const CATEGORY_BANNERS_DIR = path.join(UPLOAD_BASE, 'categories', 'banners');
const REVIEW_IMAGES_DIR = path.join(UPLOAD_BASE, 'reviews', 'images');

const maxSizeBytes = env.upload.maxFileSizeMb * 1024 * 1024;

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_').slice(0, 200) || 'file';
}

function productImageStorage(): multer.StorageEngine {
  ensureDir(PRODUCT_IMAGES_DIR);
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, PRODUCT_IMAGES_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const base = sanitizeFileName(path.basename(file.originalname, path.extname(file.originalname)));
      const name = `${base}-${Date.now()}${ext}`;
      cb(null, name);
    },
  });
}

function productFileStorage(): multer.StorageEngine {
  ensureDir(PRODUCT_FILES_DIR);
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, PRODUCT_FILES_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '';
      const base = sanitizeFileName(path.basename(file.originalname, path.extname(file.originalname)));
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

const imageFileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const mime = (file.mimetype || '').toLowerCase();
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (ALLOWED_IMAGE_MIMES.has(mime) && ALLOWED_IMAGE_EXTS.has(ext)) {
    cb(null, true);
  } else {
    cb(new AppError(400, 'Only image files (.jpg, .jpeg, .png, .gif, .webp) are allowed'));
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

const ticketAttachmentFileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (ALLOWED_TICKET_EXTS.has(ext)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        400,
        'Invalid attachment file type. Allowed formats: PDF, PNG, JPG, WEBP, TXT, DOC, DOCX, XLS, XLSX, CSV, ZIP.'
      )
    );
  }
};

const anyFileFilter = (_req: Request, _file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  cb(null, true);
};

export const uploadProductImage = multer({
  storage: isCloudinaryConfigured() ? multer.memoryStorage() : productImageStorage(),
  limits: { fileSize: maxSizeBytes },
  fileFilter: imageFileFilter,
}).single('image');

export const uploadProductImages = multer({
  storage: isCloudinaryConfigured() ? multer.memoryStorage() : productImageStorage(),
  limits: { fileSize: maxSizeBytes },
  fileFilter: imageFileFilter,
}).array('images', 10);

export const uploadProductFile = multer({
  storage: productFileStorage(),
  limits: { fileSize: maxSizeBytes },
  fileFilter: anyFileFilter,
}).single('file');

function paymentProofStorage(): multer.StorageEngine {
  ensureDir(PAYMENT_PROOFS_DIR);
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, PAYMENT_PROOFS_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const base = sanitizeFileName(path.basename(file.originalname, path.extname(file.originalname)));
      const name = `${base}-${Date.now()}${ext}`;
      cb(null, name);
    },
  });
}

export const uploadPaymentProof = multer({
  storage: isCloudinaryConfigured() ? multer.memoryStorage() : paymentProofStorage(),
  limits: { fileSize: maxSizeBytes },
  fileFilter: imageFileFilter,
}).single('proof');

function reviewImageStorage(): multer.StorageEngine {
  ensureDir(REVIEW_IMAGES_DIR);
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, REVIEW_IMAGES_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const base = sanitizeFileName(path.basename(file.originalname, path.extname(file.originalname)));
      cb(null, `${base}-${Date.now()}${ext}`);
    },
  });
}

/** One optional customer-review photo, sent in the multipart field named `image`. */
export const uploadReviewImage = multer({
  storage: isCloudinaryConfigured() ? multer.memoryStorage() : reviewImageStorage(),
  limits: { fileSize: maxSizeBytes },
  fileFilter: imageFileFilter,
}).single('image');

/** One optional size chart image, kept with other product imagery. */
export const uploadProductSizeChartImage = multer({
  storage: isCloudinaryConfigured() ? multer.memoryStorage() : productImageStorage(),
  limits: { fileSize: maxSizeBytes },
  fileFilter: imageFileFilter,
}).single('size_chart_image');

/** Relative path from upload base for storage in DB */
export function getProductImageRelativePath(filename: string): string {
  return path.join('products', 'images', filename).replace(/\\/g, '/');
}

export function getProductFileRelativePath(filename: string): string {
  return path.join('products', 'files', filename).replace(/\\/g, '/');
}

export function getPaymentProofRelativePath(filename: string): string {
  return path.join('payments', 'proofs', filename).replace(/\\/g, '/');
}

/**
 * Validates and normalizes relative paths against UPLOAD_BASE to prevent directory traversal attacks.
 */
function assertSafeUploadPath(relativePath: string): string {
  if (!relativePath || typeof relativePath !== 'string') {
    throw new AppError(400, 'Invalid file path');
  }
  const resolvedBase = path.resolve(UPLOAD_BASE);
  const resolvedPath = path.isAbsolute(relativePath)
    ? path.resolve(relativePath)
    : path.resolve(UPLOAD_BASE, relativePath);

  const normalizedBase = path.normalize(resolvedBase);
  const normalizedPath = path.normalize(resolvedPath);

  if (!normalizedPath.startsWith(normalizedBase + path.sep) && normalizedPath !== normalizedBase) {
    throw new AppError(403, 'Invalid file path: path traversal detected');
  }
  return normalizedPath;
}

/** Absolute path for a product file from DB file_path (relative to upload base). */
export function getProductFileAbsolutePath(relativePath: string): string {
  return assertSafeUploadPath(relativePath);
}

/** Absolute path for a payment proof file from DB file_path (relative to upload base). */
export function getPaymentProofAbsolutePath(relativePath: string): string {
  return assertSafeUploadPath(relativePath);
}

function ticketAttachmentStorage(): multer.StorageEngine {
  ensureDir(TICKET_ATTACHMENTS_DIR);
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, TICKET_ATTACHMENTS_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '';
      const base = sanitizeFileName(path.basename(file.originalname, path.extname(file.originalname)));
      const name = `${base}-${Date.now()}${ext}`;
      cb(null, name);
    },
  });
}

export const uploadTicketAttachment = multer({
  storage: ticketAttachmentStorage(),
  limits: { fileSize: maxSizeBytes },
  fileFilter: ticketAttachmentFileFilter,
}).single('attachment');

function settingsLogoStorage(): multer.StorageEngine {
  ensureDir(SETTINGS_LOGOS_DIR);
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, SETTINGS_LOGOS_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.png';
      const base = sanitizeFileName(path.basename(file.originalname, path.extname(file.originalname)));
      const name = `${base}-${Date.now()}${ext}`;
      cb(null, name);
    },
  });
}

export const uploadSettingsLogo = multer({
  storage: isCloudinaryConfigured() ? multer.memoryStorage() : settingsLogoStorage(),
  limits: { fileSize: maxSizeBytes },
  fileFilter: imageFileFilter,
}).single('logo');

function bannerImageStorage(): multer.StorageEngine {
  ensureDir(BANNER_IMAGES_DIR);
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, BANNER_IMAGES_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const base = sanitizeFileName(path.basename(file.originalname, path.extname(file.originalname)));
      const name = `${base}-${Date.now()}${ext}`;
      cb(null, name);
    },
  });
}

export const uploadBannerImage = multer({
  storage: isCloudinaryConfigured() ? multer.memoryStorage() : bannerImageStorage(),
  limits: { fileSize: maxSizeBytes },
  fileFilter: imageFileFilter,
}).single('background_image');

/** Relative path for ticket attachment (store in DB). */
export function getTicketAttachmentRelativePath(filename: string): string {
  return path.join('tickets', 'attachments', filename).replace(/\\/g, '/');
}

/** Absolute path for ticket attachment (stream download). */
export function getTicketAttachmentAbsolutePath(relativePath: string): string {
  return assertSafeUploadPath(relativePath);
}

/** Relative path for settings logo (store in DB). */
export function getSettingsLogoRelativePath(filename: string): string {
  return path.join('settings', 'logos', filename).replace(/\\/g, '/');
}

export function getBannerImageRelativePath(filename: string): string {
  return path.join('banners', 'images', filename).replace(/\\/g, '/');
}

export function getReviewImageRelativePath(filename: string): string {
  return path.join('reviews', 'images', filename).replace(/\\/g, '/');
}

function categoryFilesStorage(): multer.StorageEngine {
  ensureDir(CATEGORY_IMAGES_DIR);
  ensureDir(CATEGORY_BANNERS_DIR);
  return multer.diskStorage({
    destination: (_req, file, cb) => {
      cb(null, file.fieldname === 'banner_image' ? CATEGORY_BANNERS_DIR : CATEGORY_IMAGES_DIR);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const base = sanitizeFileName(path.basename(file.originalname, path.extname(file.originalname)));
      const name = `${base}-${Date.now()}${ext}`;
      cb(null, name);
    },
  });
}

export const uploadCategoryImages = multer({
  storage: isCloudinaryConfigured() ? multer.memoryStorage() : categoryFilesStorage(),
  limits: { fileSize: maxSizeBytes },
  fileFilter: imageFileFilter,
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'banner_image', maxCount: 1 },
]);

/** @deprecated use uploadCategoryImages */
export const uploadCategoryImage = uploadCategoryImages;

export function getCategoryImageRelativePath(filename: string): string {
  return path.join('categories', 'images', filename).replace(/\\/g, '/');
}

export function getCategoryBannerRelativePath(filename: string): string {
  return path.join('categories', 'banners', filename).replace(/\\/g, '/');
}
