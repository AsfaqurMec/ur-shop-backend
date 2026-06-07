import crypto from 'crypto';
import { env } from '../config';
import { AppError } from '../middlewares/errorHandler';

export function isCloudinaryConfigured(): boolean {
  return Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);
}

export async function uploadImageBuffer(
  file: Express.Multer.File,
  folder: string
): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new AppError(500, 'Cloudinary is not configured');
  }
  if (!file.buffer?.length) {
    throw new AppError(400, 'No image data received');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${env.cloudinary.apiSecret}`;
  const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');
  const blob = new Blob([file.buffer], { type: file.mimetype || 'application/octet-stream' });
  const form = new FormData();
  form.append('file', blob, file.originalname || 'upload');
  form.append('api_key', env.cloudinary.apiKey);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${env.cloudinary.cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const data = (await res.json().catch(() => null)) as { secure_url?: string; error?: { message?: string } } | null;
  if (!res.ok || !data?.secure_url) {
    throw new AppError(res.status >= 400 && res.status < 500 ? 400 : 502, data?.error?.message || 'Cloudinary upload failed');
  }
  return data.secure_url;
}
