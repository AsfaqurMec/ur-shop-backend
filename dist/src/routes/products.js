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
const express_1 = require("express");
const productController = __importStar(require("../controllers/productController"));
const validate_1 = require("../middlewares/validate");
const auth_1 = require("../middlewares/auth");
const admin_1 = require("../middlewares/admin");
const asyncHandler_1 = require("../utils/asyncHandler");
const productValidators_1 = require("../validators/productValidators");
const upload_1 = require("../middlewares/upload");
const router = (0, express_1.Router)();
// ---- Public ----
router.get('/', (0, validate_1.validate)(productValidators_1.listProductsValidator), (0, asyncHandler_1.asyncHandler)(productController.list));
router.get('/s/:slug', (0, validate_1.validate)(productValidators_1.productSlugParamValidator), (0, asyncHandler_1.asyncHandler)(productController.getBySlug));
// ---- Admin: Trending Products ----
router.put('/admin/trending', auth_1.auth, admin_1.admin, (0, validate_1.validate)(productValidators_1.setTrendingProductsValidator), (0, asyncHandler_1.asyncHandler)(productController.setTrendingProducts));
// ---- Admin: CRUD ----
router.post('/', auth_1.auth, admin_1.admin, (0, validate_1.validate)(productValidators_1.createProductValidator), (0, asyncHandler_1.asyncHandler)(productController.create));
router.put('/:id/purchase-variables', auth_1.auth, admin_1.admin, (0, validate_1.validate)(productValidators_1.replacePurchaseVariablesValidator), (0, asyncHandler_1.asyncHandler)(productController.replacePurchaseVariables));
router.put('/:id/catalog-attributes', auth_1.auth, admin_1.admin, (0, validate_1.validate)(productValidators_1.replaceCatalogAttributesValidator), (0, asyncHandler_1.asyncHandler)(productController.replaceCatalogAttributes));
router.put('/:id/catalog-variations', auth_1.auth, admin_1.admin, (0, validate_1.validate)(productValidators_1.replaceCatalogVariationsValidator), (0, asyncHandler_1.asyncHandler)(productController.replaceCatalogVariations));
router.post('/:id/catalog-variations/generate', auth_1.auth, admin_1.admin, (0, validate_1.validate)(productValidators_1.generateCatalogVariationsValidator), (0, asyncHandler_1.asyncHandler)(productController.generateCatalogVariations));
router.get('/:id', auth_1.auth, admin_1.admin, (0, validate_1.validate)(productValidators_1.productIdParamValidator), (0, asyncHandler_1.asyncHandler)(productController.getById));
router.put('/:id', auth_1.auth, admin_1.admin, (0, validate_1.validate)(productValidators_1.updateProductValidator), (0, asyncHandler_1.asyncHandler)(productController.update));
router.delete('/:id', auth_1.auth, admin_1.admin, (0, validate_1.validate)(productValidators_1.productIdParamValidator), (0, asyncHandler_1.asyncHandler)(productController.remove));
// ---- Admin: Images ----
// Multer must run before express-validator so the multipart body is not touched by other parsers first.
router.post('/:id/images', auth_1.auth, admin_1.admin, (req, res, next) => (0, upload_1.uploadProductImage)(req, res, (err) => (err ? next(err) : next())), (0, validate_1.validate)(productValidators_1.productIdParamValidator), (0, asyncHandler_1.asyncHandler)(productController.addImage));
router.post('/:id/images/bulk', auth_1.auth, admin_1.admin, (req, res, next) => (0, upload_1.uploadProductImages)(req, res, (err) => (err ? next(err) : next())), (0, validate_1.validate)(productValidators_1.productIdParamValidator), (0, asyncHandler_1.asyncHandler)(productController.addImages));
router.delete('/:id/images/:imageId', auth_1.auth, admin_1.admin, (0, validate_1.validate)(productValidators_1.imageIdParamValidator), (0, asyncHandler_1.asyncHandler)(productController.removeImage));
router.post('/:id/size-chart-image', auth_1.auth, admin_1.admin, (req, res, next) => (0, upload_1.uploadProductSizeChartImage)(req, res, (err) => (err ? next(err) : next())), (0, validate_1.validate)(productValidators_1.productIdParamValidator), (0, asyncHandler_1.asyncHandler)(productController.uploadSizeChartImage));
router.delete('/:id/size-chart-image', auth_1.auth, admin_1.admin, (0, validate_1.validate)(productValidators_1.productIdParamValidator), (0, asyncHandler_1.asyncHandler)(productController.removeSizeChartImage));
// ---- Admin: Files ----
// Multer before validators so multipart fields are available (same order as image upload).
router.post('/:id/files', auth_1.auth, admin_1.admin, (req, res, next) => (0, upload_1.uploadProductFile)(req, res, (err) => (err ? next(err) : next())), (0, validate_1.validate)(productValidators_1.addFileBodyValidator), (0, asyncHandler_1.asyncHandler)(productController.addFile));
router.delete('/:id/files/:fileId', auth_1.auth, admin_1.admin, (0, validate_1.validate)(productValidators_1.fileIdParamValidator), (0, asyncHandler_1.asyncHandler)(productController.removeFile));
// ---- Admin: License inventory ----
router.post('/:id/licenses', auth_1.auth, admin_1.admin, (0, validate_1.validate)(productValidators_1.addLicensesValidator), (0, asyncHandler_1.asyncHandler)(productController.addLicenses));
router.get('/:id/licenses', auth_1.auth, admin_1.admin, (0, validate_1.validate)(productValidators_1.productIdParamValidator), (0, asyncHandler_1.asyncHandler)(productController.getLicenseInventory));
router.get('/:id/licenses/keys', auth_1.auth, admin_1.admin, (0, validate_1.validate)(productValidators_1.listLicenseKeysValidator), (0, asyncHandler_1.asyncHandler)(productController.listLicenseKeys));
router.patch('/:id/licenses/:licenseId', auth_1.auth, admin_1.admin, (0, validate_1.validate)(productValidators_1.updateLicenseKeyValidator), (0, asyncHandler_1.asyncHandler)(productController.updateLicenseKey));
router.delete('/:id/licenses/:licenseId', auth_1.auth, admin_1.admin, (0, validate_1.validate)(productValidators_1.licenseKeyIdParamValidator), (0, asyncHandler_1.asyncHandler)(productController.deleteLicenseKey));
exports.default = router;
//# sourceMappingURL=products.js.map