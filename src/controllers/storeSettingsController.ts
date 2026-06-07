import { Request, Response } from 'express';
import { sendError, sendSuccess } from '../utils/apiResponse';
import * as storeSettingsService from '../services/storeSettingsService';
import type { StoreSettings } from '../types/storeSettings';
import { getSettingsLogoRelativePath } from '../middlewares/upload';
import * as cloudinaryService from '../services/cloudinaryService';
import { env } from '../config';

export async function getAdminStoreSettings(_req: Request, res: Response): Promise<Response> {
  const settings = await storeSettingsService.getStoreSettings();
  return sendSuccess(res, { settings });
}

export async function updateAdminStoreSettings(req: Request, res: Response): Promise<Response> {
  const patch = req.body as Partial<StoreSettings>;
  const settings = await storeSettingsService.updateStoreSettings(patch);
  return sendSuccess(res, { settings }, 200, 'Store settings updated');
}

export async function getPublicStoreSettings(_req: Request, res: Response): Promise<Response> {
  const settings = await storeSettingsService.getPublicStoreSettings();
  return sendSuccess(res, { settings });
}

export async function uploadStoreLogo(req: Request, res: Response): Promise<Response> {
  const file = req.file;
  if (!file) {
    return sendError(
      res,
      'No logo file received. Choose a JPEG, PNG, GIF, or WebP file and ensure the field name is "logo".',
      400
    );
  }
  const relPath = cloudinaryService.isCloudinaryConfigured()
    ? await cloudinaryService.uploadImageBuffer(file, env.cloudinary.settingsFolder)
    : getSettingsLogoRelativePath(file.filename);
  const origin = `${req.protocol}://${req.get('host')}`;
  const logoUrl = /^https?:\/\//i.test(relPath) ? relPath : `${origin}/${relPath}`;
  return sendSuccess(res, { logo_url: logoUrl, logo_path: relPath }, 201, 'Logo uploaded');
}
