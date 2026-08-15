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
exports.getById = getById;
exports.replaceCatalogAttributes = replaceCatalogAttributes;
exports.replaceCatalogVariations = replaceCatalogVariations;
exports.generateCatalogVariations = generateCatalogVariations;
exports.replacePurchaseVariables = replacePurchaseVariables;
exports.addImage = addImage;
exports.addImages = addImages;
exports.removeImage = removeImage;
exports.uploadSizeChartImage = uploadSizeChartImage;
exports.removeSizeChartImage = removeSizeChartImage;
exports.addFile = addFile;
exports.removeFile = removeFile;
exports.addLicenses = addLicenses;
exports.getLicenseInventory = getLicenseInventory;
exports.listLicenseKeys = listLicenseKeys;
exports.updateLicenseKey = updateLicenseKey;
exports.deleteLicenseKey = deleteLicenseKey;
const apiResponse_1 = require("../utils/apiResponse");
const productService = __importStar(require("../services/productService"));
const productCatalogService = __importStar(require("../services/productCatalogService"));
const cloudinaryService = __importStar(require("../services/cloudinaryService"));
const config_1 = require("../config");
async function create(req, res) {
    const body = req.body;
    const product = await productService.create({
        name: body.name,
        slug: body.slug,
        description: body.description,
        full_description: body.full_description ?? body.fullDescription,
        features: body.features,
        category_id: body.category_id,
        product_type: body.product_type,
        manual_fulfillment_required: body.manual_fulfillment_required,
        price: body.price,
        compare_at_price: body.compare_at_price,
        is_active: body.is_active,
        is_featured: body.is_featured,
    });
    return (0, apiResponse_1.sendSuccess)(res, { product }, 201);
}
async function update(req, res) {
    const id = Number(req.params.id);
    const body = req.body;
    const product = await productService.update(id, {
        name: body.name,
        slug: body.slug,
        description: body.description,
        full_description: body.full_description ?? body.fullDescription,
        features: body.features,
        category_id: body.category_id,
        product_type: body.product_type,
        manual_fulfillment_required: body.manual_fulfillment_required,
        price: body.price,
        compare_at_price: body.compare_at_price,
        sku: body.sku,
        quantity: body.quantity,
        default_variation_id: body.default_variation_id,
        is_active: body.is_active,
        is_featured: body.is_featured,
    });
    return (0, apiResponse_1.sendSuccess)(res, { product });
}
async function remove(req, res) {
    const id = Number(req.params.id);
    await productService.remove(id);
    return (0, apiResponse_1.sendSuccess)(res, { message: 'Product deleted' });
}
async function list(req, res) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const category_id = req.query.category_id != null ? Number(req.query.category_id) : undefined;
    const product_type = req.query.product_type;
    const min_price = req.query.min_price != null ? Number(req.query.min_price) : undefined;
    const max_price = req.query.max_price != null ? Number(req.query.max_price) : undefined;
    const on_sale = req.query.on_sale === '1' || req.query.on_sale === 'true';
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const featured = req.query.featured === '1' || req.query.featured === 'true';
    const is_active = req.query.is_active === undefined
        ? undefined
        : req.query.is_active === '1' || req.query.is_active === 'true';
    const sort = typeof req.query.sort === 'string' ? req.query.sort : undefined;
    const result = await productService.list({
        page,
        limit,
        category_id,
        product_type: product_type,
        min_price,
        max_price,
        on_sale: on_sale || undefined,
        search,
        featured: featured || undefined,
        is_active,
        sort: sort,
    });
    return (0, apiResponse_1.sendSuccess)(res, result);
}
async function getBySlug(req, res) {
    const slug = req.params.slug;
    const product = await productService.getBySlug(slug, true);
    return (0, apiResponse_1.sendSuccess)(res, { product });
}
async function getById(req, res) {
    const id = Number(req.params.id);
    const product = await productService.getById(id);
    return (0, apiResponse_1.sendSuccess)(res, { product });
}
async function replaceCatalogAttributes(req, res) {
    const id = Number(req.params.id);
    await productCatalogService.replaceCatalogAttributes(id, { attributes: req.body.attributes });
    const product = await productService.getById(id);
    return (0, apiResponse_1.sendSuccess)(res, { product });
}
async function replaceCatalogVariations(req, res) {
    const id = Number(req.params.id);
    await productCatalogService.replaceCatalogVariations(id, { variations: req.body.variations });
    const product = await productService.getById(id);
    return (0, apiResponse_1.sendSuccess)(res, { product });
}
async function generateCatalogVariations(req, res) {
    const id = Number(req.params.id);
    const result = await productCatalogService.generateCatalogVariations(id);
    const product = await productService.getById(id);
    return (0, apiResponse_1.sendSuccess)(res, { product, ...result });
}
async function replacePurchaseVariables(req, res) {
    const productId = Number(req.params.id);
    const raw = Array.isArray(req.body.variables) ? req.body.variables : [];
    const variables = raw.map((v, idx) => ({
        var_key: String(v.var_key ?? '').trim(),
        label: String(v.label ?? '').trim(),
        kind: v.kind === 'email' ? 'email' : 'select',
        enabled: Boolean(v.enabled),
        required: Boolean(v.required),
        sort_order: typeof v.sort_order === 'number' ? v.sort_order : idx,
        options: Array.isArray(v.options)
            ? v.options.map((o, j) => ({
                option_key: String(o.option_key ?? '').trim(),
                label: String(o.label ?? '').trim(),
                price_adjustment: Number(o.price_adjustment ?? 0) || 0,
                sort_order: typeof o.sort_order === 'number' ? o.sort_order : j,
            }))
            : [],
    }));
    const product = await productService.replacePurchaseVariables(productId, variables);
    return (0, apiResponse_1.sendSuccess)(res, { product });
}
async function addImage(req, res) {
    const productId = Number(req.params.id);
    const file = req.file;
    if (!file) {
        return (0, apiResponse_1.sendError)(res, 'No image file received. Choose a JPEG, PNG, GIF, or WebP file and ensure the form field name is "image".', 400);
    }
    const storedPath = cloudinaryService.isCloudinaryConfigured()
        ? await cloudinaryService.uploadImageBuffer(file, config_1.env.cloudinary.productFolder)
        : file.filename;
    if (!storedPath)
        return (0, apiResponse_1.sendError)(res, 'No image file received', 400);
    const image = await productService.addImage(productId, storedPath, req.body?.alt_text, req.body?.sort_order != null ? Number(req.body.sort_order) : undefined);
    return (0, apiResponse_1.sendSuccess)(res, { image }, 201);
}
async function addImages(req, res) {
    const productId = Number(req.params.id);
    const files = req.files || [];
    if (files.length === 0) {
        return (0, apiResponse_1.sendError)(res, 'No image file received. Choose one JPEG, PNG, GIF, or WebP file (field name "images").', 400);
    }
    const images = [];
    for (let i = 0; i < files.length; i += 1) {
        const f = files[i];
        const storedPath = cloudinaryService.isCloudinaryConfigured()
            ? await cloudinaryService.uploadImageBuffer(f, config_1.env.cloudinary.productFolder)
            : f.filename;
        if (storedPath) {
            images.push(await productService.addImage(productId, storedPath, undefined, i));
        }
    }
    return (0, apiResponse_1.sendSuccess)(res, { images }, 201);
}
async function removeImage(req, res) {
    const productId = Number(req.params.id);
    const imageId = Number(req.params.imageId);
    await productService.removeImage(productId, imageId);
    return (0, apiResponse_1.sendSuccess)(res, { message: 'Image deleted' });
}
async function uploadSizeChartImage(req, res) {
    const productId = Number(req.params.id);
    const file = req.file;
    if (!file)
        return (0, apiResponse_1.sendError)(res, 'Choose a size chart image to upload.', 400);
    const storedPath = cloudinaryService.isCloudinaryConfigured()
        ? await cloudinaryService.uploadImageBuffer(file, config_1.env.cloudinary.productFolder)
        : file.filename;
    const product = await productService.setSizeChartImage(productId, storedPath || null);
    return (0, apiResponse_1.sendSuccess)(res, { product });
}
async function removeSizeChartImage(req, res) {
    const product = await productService.setSizeChartImage(Number(req.params.id), null);
    return (0, apiResponse_1.sendSuccess)(res, { product });
}
async function addFile(req, res) {
    const productId = Number(req.params.id);
    const file = req.file;
    if (!file?.filename)
        return (0, apiResponse_1.sendError)(res, 'No file uploaded', 400);
    const fileSize = file.size ?? null;
    const displayName = req.body?.file_name?.trim() || file.originalname || file.filename;
    const downloadLimit = req.body?.download_limit != null ? Number(req.body.download_limit) : undefined;
    const sortOrder = req.body?.sort_order != null ? Number(req.body.sort_order) : undefined;
    const productFile = await productService.addFile(productId, file.filename, displayName, fileSize, downloadLimit, sortOrder);
    return (0, apiResponse_1.sendSuccess)(res, { file: productFile }, 201);
}
async function removeFile(req, res) {
    const productId = Number(req.params.id);
    const fileId = Number(req.params.fileId);
    await productService.removeFile(productId, fileId);
    return (0, apiResponse_1.sendSuccess)(res, { message: 'File deleted' });
}
async function addLicenses(req, res) {
    const productId = Number(req.params.id);
    const keys = Array.isArray(req.body.keys) ? req.body.keys : [];
    const rawVid = req.body.product_variation_id;
    const productVariationId = rawVid != null && rawVid !== '' && Number.isFinite(Number(rawVid)) ? Math.trunc(Number(rawVid)) : null;
    const result = await productService.addLicenseKeys(productId, keys, productVariationId);
    return (0, apiResponse_1.sendSuccess)(res, result, 201);
}
async function getLicenseInventory(req, res) {
    const productId = Number(req.params.id);
    const result = await productService.getLicenseInventory(productId);
    return (0, apiResponse_1.sendSuccess)(res, result);
}
async function listLicenseKeys(req, res) {
    const productId = Number(req.params.id);
    const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
    const offset = req.query.offset != null ? Number(req.query.offset) : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const productVariationId = req.query.product_variation_id != null ? Number(req.query.product_variation_id) : undefined;
    const result = await productService.listLicenseKeys(productId, {
        limit,
        offset,
        status: status,
        product_variation_id: productVariationId,
    });
    return (0, apiResponse_1.sendSuccess)(res, result);
}
async function updateLicenseKey(req, res) {
    const productId = Number(req.params.id);
    const licenseId = Number(req.params.licenseId);
    const licenseKey = String(req.body.license_key ?? '').trim();
    const hasVid = Object.prototype.hasOwnProperty.call(req.body, 'product_variation_id');
    const nextVariationId = hasVid
        ? req.body.product_variation_id == null || req.body.product_variation_id === ''
            ? null
            : Number(req.body.product_variation_id)
        : undefined;
    const key = await productService.updateLicenseKey(productId, licenseId, licenseKey, nextVariationId);
    return (0, apiResponse_1.sendSuccess)(res, { key });
}
async function deleteLicenseKey(req, res) {
    const productId = Number(req.params.id);
    const licenseId = Number(req.params.licenseId);
    await productService.deleteLicenseKey(productId, licenseId);
    return (0, apiResponse_1.sendSuccess)(res, { message: 'License key deleted' });
}
//# sourceMappingURL=productController.js.map