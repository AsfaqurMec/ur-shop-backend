import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import type { Response } from 'express';
import pool from '../database/pool';
import { AppError } from '../middlewares/errorHandler';
import { getProductFileAbsolutePath } from '../middlewares/upload';
import * as entitlementRepo from '../repositories/downloadEntitlementRepository';
import * as downloadTokenRepo from '../repositories/downloadTokenRepository';
import * as downloadRepo from '../repositories/downloadRepository';
import * as productRepo from '../repositories/productRepository';
import type { DownloadableItemPublic, DownloadTokenPublic } from '../types/download';

const TOKEN_EXPIRY_MINUTES = 15;
const TOKEN_MAX_USES = 1;

/** List current user's downloadable items (entitlements with file info and download count/limit). */
export async function listDownloadables(userId: number): Promise<DownloadableItemPublic[]> {
  const rows = await entitlementRepo.findEntitlementsForUser(userId);
  const now = new Date();
  return rows.map((r) => ({
    entitlement_id: r.entitlement_id,
    order_item_id: r.order_item_id,
    order_id: r.order_id,
    order_number: r.order_number,
    product_id: r.product_id,
    product_name: r.product_name,
    product_file_id: r.product_file_id,
    file_name: r.file_name,
    file_size: r.file_size,
    download_count: r.download_count,
    download_limit: r.download_limit,
    expires_at: r.expires_at ? r.expires_at.toISOString() : null,
    created_at: r.created_at.toISOString(),
  }));
}

/** Generate a secure temporary download token for an entitlement owned by the user. */
export async function createDownloadToken(
  userId: number,
  entitlementId: number
): Promise<DownloadTokenPublic> {
  const entitlement = await entitlementRepo.findByIdForUser(entitlementId, userId);
  if (!entitlement) throw new AppError(404, 'Entitlement not found');

  if (entitlement.expires_at && new Date(entitlement.expires_at) <= new Date()) {
    throw new AppError(400, 'This download has expired');
  }

  const file = await productRepo.findProductFileByIdOnly(entitlement.product_file_id);
  if (!file) throw new AppError(404, 'File not found');

  const downloadCount = await downloadRepo.countByOrderItemAndFile(
    entitlement.order_item_id,
    entitlement.product_file_id
  );
  if (file.download_limit != null && downloadCount >= file.download_limit) {
    throw new AppError(400, 'Download limit reached for this file');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await downloadTokenRepo.create(conn, {
      token,
      entitlement_id: entitlementId,
      user_id: userId,
      expires_at: expiresAt,
      max_uses: TOKEN_MAX_USES,
    });
    await conn.commit();
  } finally {
    conn.release();
  }

  // Path relative to API root (same base as the frontend PUBLIC_API_URL, which already includes apiPrefix).
  const url = `/downloads/file?token=${encodeURIComponent(token)}`;

  return {
    token,
    expires_at: expiresAt.toISOString(),
    url,
  };
}

/** Validate token, record download, increment token use, then stream file. Call from controller. */
export async function validateTokenAndStream(
  token: string,
  res: Response,
  ip: string | null,
  userAgent: string | null
): Promise<void> {
  const row = await downloadTokenRepo.findByToken(token);
  if (!row) throw new AppError(404, 'Invalid or expired download link');

  const now = new Date();
  if (new Date(row.expires_at) <= now) throw new AppError(404, 'Invalid or expired download link');
  if (row.use_count >= row.max_uses) throw new AppError(404, 'Invalid or expired download link');

  const entitlement = await entitlementRepo.findByIdForUser(row.entitlement_id, row.user_id);
  if (!entitlement) throw new AppError(404, 'Entitlement not found');

  if (entitlement.expires_at && new Date(entitlement.expires_at) <= now) {
    throw new AppError(400, 'This download has expired');
  }

  const file = await productRepo.findProductFileByIdOnly(entitlement.product_file_id);
  if (!file) throw new AppError(404, 'File not found');

  const downloadCount = await downloadRepo.countByOrderItemAndFile(
    entitlement.order_item_id,
    entitlement.product_file_id
  );
  if (file.download_limit != null && downloadCount >= file.download_limit) {
    throw new AppError(400, 'Download limit reached for this file');
  }

  const absolutePath = getProductFileAbsolutePath(file.file_path);
  if (!fs.existsSync(absolutePath)) throw new AppError(404, 'File not found on server');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const incremented = await downloadTokenRepo.incrementUseCount(conn, row.id);
    if (!incremented) {
      await conn.rollback();
      throw new AppError(404, 'Invalid or expired download link');
    }
    await downloadRepo.create(conn, {
      order_item_id: entitlement.order_item_id,
      user_id: row.user_id,
      product_file_id: entitlement.product_file_id,
      ip,
      user_agent: userAgent,
    });
    await conn.commit();
  } finally {
    conn.release();
  }

  const filename = file.file_name || path.basename(file.file_path);
  res.setHeader('Content-Disposition', `attachment; filename="${filename.replace(/"/g, '\\"')}"`);
  if (file.file_size != null) res.setHeader('Content-Length', String(file.file_size));

  const stream = fs.createReadStream(absolutePath);
  stream.on('error', (err) => {
    if (!res.headersSent) res.status(500).end();
    else res.end();
  });
  stream.pipe(res);
}
