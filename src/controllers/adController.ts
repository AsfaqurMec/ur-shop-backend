import { Request, Response } from 'express';
import { sendError, sendSuccess } from '../utils/apiResponse';
import * as service from '../services/adService';
import * as cloudinary from '../services/cloudinaryService';
import { env } from '../config';
import { getBannerImageRelativePath } from '../middlewares/upload';

async function image(file?: Express.Multer.File) { return file ? (cloudinary.isCloudinaryConfigured() ? cloudinary.uploadImageBuffer(file, env.cloudinary.bannerFolder) : getBannerImageRelativePath(file.filename)) : null; }
const active = (value: unknown) => value === true || value === 'true' || value === '1';
export async function create(req: Request, res: Response) { const path = await image(req.file); if (!path) return sendError(res, 'Ad image is required', 400); return sendSuccess(res, { ad: await service.create(path, req.body.is_active === undefined || active(req.body.is_active)) }, 201); }
export async function update(req: Request, res: Response) { const path = await image(req.file); return sendSuccess(res, { ad: await service.update(Number(req.params.id), { ...(path ? { image_path: path } : {}), ...(req.body.is_active !== undefined ? { is_active: active(req.body.is_active) } : {}) }) }); }
export async function remove(req: Request, res: Response) { await service.remove(Number(req.params.id)); return sendSuccess(res, { message: 'Ad deleted' }); }
export async function listAdmin(_req: Request, res: Response) { return sendSuccess(res, { ads: await service.listAdmin() }); }
export async function listPublic(_req: Request, res: Response) { return sendSuccess(res, { ads: await service.listPublic() }); }
