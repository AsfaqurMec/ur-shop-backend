import { Router } from 'express';
import * as productController from '../controllers/productController';
import { validate } from '../middlewares/validate';
import { auth } from '../middlewares/auth';
import { admin } from '../middlewares/admin';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createProductValidator,
  updateProductValidator,
  productIdParamValidator,
  productSlugParamValidator,
  listProductsValidator,
  imageIdParamValidator,
  addFileBodyValidator,
  fileIdParamValidator,
  addLicensesValidator,
  listLicenseKeysValidator,
  updateLicenseKeyValidator,
  licenseKeyIdParamValidator,
  replacePurchaseVariablesValidator,
  replaceCatalogAttributesValidator,
  replaceCatalogVariationsValidator,
  generateCatalogVariationsValidator,
} from '../validators/productValidators';
import { uploadProductImage, uploadProductImages, uploadProductFile } from '../middlewares/upload';

const router = Router();

// ---- Public ----
router.get('/', validate(listProductsValidator), asyncHandler(productController.list));
router.get('/s/:slug', validate(productSlugParamValidator), asyncHandler(productController.getBySlug));

// ---- Admin: CRUD ----
router.post('/', auth, admin, validate(createProductValidator), asyncHandler(productController.create));
router.put(
  '/:id/purchase-variables',
  auth,
  admin,
  validate(replacePurchaseVariablesValidator),
  asyncHandler(productController.replacePurchaseVariables)
);
router.put(
  '/:id/catalog-attributes',
  auth,
  admin,
  validate(replaceCatalogAttributesValidator),
  asyncHandler(productController.replaceCatalogAttributes)
);
router.put(
  '/:id/catalog-variations',
  auth,
  admin,
  validate(replaceCatalogVariationsValidator),
  asyncHandler(productController.replaceCatalogVariations)
);
router.post(
  '/:id/catalog-variations/generate',
  auth,
  admin,
  validate(generateCatalogVariationsValidator),
  asyncHandler(productController.generateCatalogVariations)
);
router.get('/:id', auth, admin, validate(productIdParamValidator), asyncHandler(productController.getById));
router.put('/:id', auth, admin, validate(updateProductValidator), asyncHandler(productController.update));
router.delete('/:id', auth, admin, validate(productIdParamValidator), asyncHandler(productController.remove));

// ---- Admin: Images ----
// Multer must run before express-validator so the multipart body is not touched by other parsers first.
router.post(
  '/:id/images',
  auth,
  admin,
  (req, res, next) => uploadProductImage(req, res, (err) => (err ? next(err) : next())),
  validate(productIdParamValidator),
  asyncHandler(productController.addImage)
);
router.post(
  '/:id/images/bulk',
  auth,
  admin,
  (req, res, next) => uploadProductImages(req, res, (err) => (err ? next(err) : next())),
  validate(productIdParamValidator),
  asyncHandler(productController.addImages)
);
router.delete(
  '/:id/images/:imageId',
  auth,
  admin,
  validate(imageIdParamValidator),
  asyncHandler(productController.removeImage)
);

// ---- Admin: Files ----
// Multer before validators so multipart fields are available (same order as image upload).
router.post(
  '/:id/files',
  auth,
  admin,
  (req, res, next) => uploadProductFile(req, res, (err) => (err ? next(err) : next())),
  validate(addFileBodyValidator),
  asyncHandler(productController.addFile)
);
router.delete(
  '/:id/files/:fileId',
  auth,
  admin,
  validate(fileIdParamValidator),
  asyncHandler(productController.removeFile)
);

// ---- Admin: License inventory ----
router.post(
  '/:id/licenses',
  auth,
  admin,
  validate(addLicensesValidator),
  asyncHandler(productController.addLicenses)
);
router.get(
  '/:id/licenses',
  auth,
  admin,
  validate(productIdParamValidator),
  asyncHandler(productController.getLicenseInventory)
);
router.get(
  '/:id/licenses/keys',
  auth,
  admin,
  validate(listLicenseKeysValidator),
  asyncHandler(productController.listLicenseKeys)
);
router.patch(
  '/:id/licenses/:licenseId',
  auth,
  admin,
  validate(updateLicenseKeyValidator),
  asyncHandler(productController.updateLicenseKey)
);
router.delete(
  '/:id/licenses/:licenseId',
  auth,
  admin,
  validate(licenseKeyIdParamValidator),
  asyncHandler(productController.deleteLicenseKey)
);

export default router;
