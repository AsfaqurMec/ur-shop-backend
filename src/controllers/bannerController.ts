import { Request, Response } from 'express';
import { sendError, sendSuccess } from '../utils/apiResponse';
import * as bannerService from '../services/bannerService';
import * as cloudinaryService from '../services/cloudinaryService';
import { env } from '../config';
import { getBannerImageRelativePath } from '../middlewares/upload';

async function getUploadedImagePath(file?: Express.Multer.File): Promise<string | null> {
  if (!file) return null;
  return cloudinaryService.isCloudinaryConfigured()
    ? cloudinaryService.uploadImageBuffer(file, env.cloudinary.bannerFolder)
    : getBannerImageRelativePath(file.filename);
}

function bodyBoolean(value: unknown, fallback = true): boolean {
  if (value === undefined || value === null || value === '') return fallback;
  return value === true || value === 'true' || value === '1' || value === 1;
}

export async function create(req: Request, res: Response): Promise<Response> {
  const backgroundImage = await getUploadedImagePath(req.file);
  if (!backgroundImage) {
    return sendError(res, 'Background image is required', 400);
  }
  const banner = await bannerService.create({
    background_image: backgroundImage,
    title: req.body.title,
    subtitle: req.body.subtitle,
    buttons: req.body.buttons,
    sort_order: Number(req.body.sort_order ?? 0),
    is_active: bodyBoolean(req.body.is_active, true),
  });
  return sendSuccess(res, { banner }, 201);
}

export async function update(req: Request, res: Response): Promise<Response> {
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
  return sendSuccess(res, { banner });
}

export async function remove(req: Request, res: Response): Promise<Response> {
  const id = Number(req.params.id);
  await bannerService.remove(id);
  return sendSuccess(res, { message: 'Banner deleted' });
}

export async function listAdmin(_req: Request, res: Response): Promise<Response> {
  const banners = await bannerService.listAdmin();
  return sendSuccess(res, { banners });
}

export async function listPublic(_req: Request, res: Response): Promise<Response> {
  const banners = await bannerService.listPublic();
  return sendSuccess(res, { banners });
}
