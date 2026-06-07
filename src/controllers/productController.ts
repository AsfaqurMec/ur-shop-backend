import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse';
import * as productService from '../services/productService';
import * as productCatalogService from '../services/productCatalogService';
import * as cloudinaryService from '../services/cloudinaryService';
import { env } from '../config';
import type { AdminVariableInput } from '../repositories/productPurchaseVariableRepository';

export async function create(req: Request, res: Response): Promise<Response> {
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
  return sendSuccess(res, { product }, 201);
}

export async function update(req: Request, res: Response): Promise<Response> {
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
  return sendSuccess(res, { product });
}

export async function remove(req: Request, res: Response): Promise<Response> {
  const id = Number(req.params.id);
  await productService.remove(id);
  return sendSuccess(res, { message: 'Product deleted' });
}

export async function list(req: Request, res: Response): Promise<Response> {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const category_id = req.query.category_id != null ? Number(req.query.category_id) : undefined;
  const product_type = req.query.product_type as string | undefined;
  const min_price = req.query.min_price != null ? Number(req.query.min_price) : undefined;
  const max_price = req.query.max_price != null ? Number(req.query.max_price) : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const featured = req.query.featured === '1' || req.query.featured === 'true';
  const is_active = req.query.is_active === undefined
    ? undefined
    : req.query.is_active === '1' || req.query.is_active === 'true';
  const result = await productService.list({
    page,
    limit,
    category_id,
    product_type: product_type as any,
    min_price,
    max_price,
    search,
    featured: featured || undefined,
    is_active,
  });
  return sendSuccess(res, result);
}

export async function getBySlug(req: Request, res: Response): Promise<Response> {
  const slug = req.params.slug as string;
  const product = await productService.getBySlug(slug, true);
  return sendSuccess(res, { product });
}

export async function getById(req: Request, res: Response): Promise<Response> {
  const id = Number(req.params.id);
  const product = await productService.getById(id);
  return sendSuccess(res, { product });
}

export async function replaceCatalogAttributes(req: Request, res: Response): Promise<Response> {
  const id = Number(req.params.id);
  await productCatalogService.replaceCatalogAttributes(id, { attributes: req.body.attributes });
  const product = await productService.getById(id);
  return sendSuccess(res, { product });
}

export async function replaceCatalogVariations(req: Request, res: Response): Promise<Response> {
  const id = Number(req.params.id);
  await productCatalogService.replaceCatalogVariations(id, { variations: req.body.variations });
  const product = await productService.getById(id);
  return sendSuccess(res, { product });
}

export async function generateCatalogVariations(req: Request, res: Response): Promise<Response> {
  const id = Number(req.params.id);
  const result = await productCatalogService.generateCatalogVariations(id);
  const product = await productService.getById(id);
  return sendSuccess(res, { product, ...result });
}

export async function replacePurchaseVariables(req: Request, res: Response): Promise<Response> {
  const productId = Number(req.params.id);
  const raw = Array.isArray(req.body.variables) ? req.body.variables : [];
  const variables: AdminVariableInput[] = raw.map((v: Record<string, unknown>, idx: number) => ({
    var_key: String(v.var_key ?? '').trim(),
    label: String(v.label ?? '').trim(),
    kind: v.kind === 'email' ? 'email' : 'select',
    enabled: Boolean(v.enabled),
    required: Boolean(v.required),
    sort_order: typeof v.sort_order === 'number' ? v.sort_order : idx,
    options: Array.isArray(v.options)
      ? (v.options as Record<string, unknown>[]).map((o, j) => ({
          option_key: String(o.option_key ?? '').trim(),
          label: String(o.label ?? '').trim(),
          price_adjustment: Number(o.price_adjustment ?? 0) || 0,
          sort_order: typeof o.sort_order === 'number' ? o.sort_order : j,
        }))
      : [],
  }));
  const product = await productService.replacePurchaseVariables(productId, variables);
  return sendSuccess(res, { product });
}

export async function addImage(req: Request, res: Response): Promise<Response> {
  const productId = Number(req.params.id);
  const file = req.file;
  if (!file) {
    return sendError(
      res,
      'No image file received. Choose a JPEG, PNG, GIF, or WebP file and ensure the form field name is "image".',
      400
    );
  }
  const storedPath = cloudinaryService.isCloudinaryConfigured()
    ? await cloudinaryService.uploadImageBuffer(file, env.cloudinary.productFolder)
    : file.filename;
  if (!storedPath) return sendError(res, 'No image file received', 400);
  const image = await productService.addImage(
    productId,
    storedPath,
    req.body?.alt_text,
    req.body?.sort_order != null ? Number(req.body.sort_order) : undefined
  );
  return sendSuccess(res, { image }, 201);
}

export async function addImages(req: Request, res: Response): Promise<Response> {
  const productId = Number(req.params.id);
  const files = (req.files as Express.Multer.File[]) || [];
  if (files.length === 0) {
    return sendError(
      res,
      'No image file received. Choose one JPEG, PNG, GIF, or WebP file (field name "images").',
      400
    );
  }
  const images = [];
  for (let i = 0; i < files.length; i += 1) {
    const f = files[i];
    const storedPath = cloudinaryService.isCloudinaryConfigured()
      ? await cloudinaryService.uploadImageBuffer(f, env.cloudinary.productFolder)
      : f.filename;
    if (storedPath) {
      images.push(await productService.addImage(productId, storedPath, undefined, i));
    }
  }
  return sendSuccess(res, { images }, 201);
}

export async function removeImage(req: Request, res: Response): Promise<Response> {
  const productId = Number(req.params.id);
  const imageId = Number(req.params.imageId);
  await productService.removeImage(productId, imageId);
  return sendSuccess(res, { message: 'Image deleted' });
}

export async function addFile(req: Request, res: Response): Promise<Response> {
  const productId = Number(req.params.id);
  const file = req.file;
  if (!file?.filename) return sendError(res, 'No file uploaded', 400);
  const fileSize = file.size ?? null;
  const displayName = req.body?.file_name?.trim() || file.originalname || file.filename;
  const downloadLimit = req.body?.download_limit != null ? Number(req.body.download_limit) : undefined;
  const sortOrder = req.body?.sort_order != null ? Number(req.body.sort_order) : undefined;
  const productFile = await productService.addFile(
    productId,
    file.filename,
    displayName,
    fileSize,
    downloadLimit,
    sortOrder
  );
  return sendSuccess(res, { file: productFile }, 201);
}

export async function removeFile(req: Request, res: Response): Promise<Response> {
  const productId = Number(req.params.id);
  const fileId = Number(req.params.fileId);
  await productService.removeFile(productId, fileId);
  return sendSuccess(res, { message: 'File deleted' });
}

export async function addLicenses(req: Request, res: Response): Promise<Response> {
  const productId = Number(req.params.id);
  const keys = Array.isArray(req.body.keys) ? req.body.keys : [];
  const rawVid = req.body.product_variation_id;
  const productVariationId =
    rawVid != null && rawVid !== '' && Number.isFinite(Number(rawVid)) ? Math.trunc(Number(rawVid)) : null;
  const result = await productService.addLicenseKeys(productId, keys, productVariationId);
  return sendSuccess(res, result, 201);
}

export async function getLicenseInventory(req: Request, res: Response): Promise<Response> {
  const productId = Number(req.params.id);
  const result = await productService.getLicenseInventory(productId);
  return sendSuccess(res, result);
}

export async function listLicenseKeys(req: Request, res: Response): Promise<Response> {
  const productId = Number(req.params.id);
  const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
  const offset = req.query.offset != null ? Number(req.query.offset) : undefined;
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const productVariationId =
    req.query.product_variation_id != null ? Number(req.query.product_variation_id) : undefined;
  const result = await productService.listLicenseKeys(productId, {
    limit,
    offset,
    status: status as 'all' | 'available' | 'used' | undefined,
    product_variation_id: productVariationId,
  });
  return sendSuccess(res, result);
}

export async function updateLicenseKey(req: Request, res: Response): Promise<Response> {
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
  return sendSuccess(res, { key });
}

export async function deleteLicenseKey(req: Request, res: Response): Promise<Response> {
  const productId = Number(req.params.id);
  const licenseId = Number(req.params.licenseId);
  await productService.deleteLicenseKey(productId, licenseId);
  return sendSuccess(res, { message: 'License key deleted' });
}
