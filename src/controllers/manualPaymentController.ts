import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { sendSuccess, sendError } from '../utils/apiResponse';
import * as manualPaymentService from '../services/manualPaymentService';
import * as paymentOptionService from '../services/paymentOptionService';
import { getPaymentProofRelativePath, getPaymentProofAbsolutePath } from '../middlewares/upload';
import * as cloudinaryService from '../services/cloudinaryService';
import { env } from '../config';
import type { PaymentProofStatus } from '../types/payment';

const PROOF_EXT_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

export async function listPaymentMethods(_req: Request, res: Response): Promise<Response> {
  const methods = await paymentOptionService.listPublicPaymentMethods();
  return sendSuccess(res, { payment_methods: methods });
}

export async function submitProof(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const userId = req.user.id;
  const orderId = Number(req.params.orderId);
  const file = req.file;
  if (!file) return sendError(res, 'Payment proof file (proof) is required', 400);
  const filePath = cloudinaryService.isCloudinaryConfigured()
    ? await cloudinaryService.uploadImageBuffer(file, env.cloudinary.proofFolder)
    : getPaymentProofRelativePath(file.filename);
  const proof = await manualPaymentService.submitProof(
    userId,
    orderId,
    {
      sender_number: req.body.sender_number,
      transaction_id: req.body.transaction_id,
      paid_amount: req.body.paid_amount != null ? Number(req.body.paid_amount) : undefined,
    },
    filePath
  );
  return sendSuccess(res, { proof }, 201, 'Payment proof submitted');
}

export async function getProofsForOrder(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const orderId = Number(req.params.orderId);
  const proofs = await manualPaymentService.getProofsByOrderId(orderId, req.user.id);
  return sendSuccess(res, { proofs });
}

export async function listPendingProofs(req: Request, res: Response): Promise<Response> {
  const proofs = await manualPaymentService.listPendingProofs();
  return sendSuccess(res, { proofs });
}

export async function listRecentProofsAdmin(req: Request, res: Response): Promise<Response> {
  const limitRaw = req.query.limit != null ? Number(req.query.limit) : 30;
  const limit = Math.min(100, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 30));
  const offsetRaw = req.query.offset != null ? Number(req.query.offset) : 0;
  const offset = Math.max(0, Number.isFinite(offsetRaw) ? offsetRaw : 0);
  const excludePending =
    req.query.exclude_pending === 'true' || req.query.exclude_pending === '1';
  const rawStatus = typeof req.query.status === 'string' ? req.query.status : undefined;
  const allowed: (PaymentProofStatus | 'all')[] = ['pending', 'verified', 'rejected', 'all'];
  const statusFilter =
    rawStatus && allowed.includes(rawStatus as PaymentProofStatus | 'all')
      ? (rawStatus as PaymentProofStatus | 'all')
      : 'all';
  const status = statusFilter === 'all' ? undefined : statusFilter;
  const { proofs, total } = await manualPaymentService.listRecentProofsForAdmin(
    limit,
    offset,
    status,
    excludePending
  );
  return sendSuccess(res, { proofs, total });
}

export async function downloadProofFile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    sendError(res, 'Unauthorized', 401);
    return;
  }
  const proofId = Number(req.params.id);
  const proof = await manualPaymentService.getProofById(proofId);
  if (!proof) {
    sendError(res, 'Payment proof not found', 404);
    return;
  }
  if (!proof.file_path) {
    sendError(res, 'This proof has no file attachment (transaction reference only).', 404);
    return;
  }
  if (/^https?:\/\//i.test(proof.file_path)) {
    res.redirect(proof.file_path);
    return;
  }
  const absolutePath = getPaymentProofAbsolutePath(proof.file_path);
  if (!fs.existsSync(absolutePath)) {
    sendError(res, 'File not found', 404);
    return;
  }
  const ext = path.extname(proof.file_path).toLowerCase();
  const mime = PROOF_EXT_MIME[ext] ?? 'application/octet-stream';
  res.setHeader('Content-Type', mime);
  const safeName = `proof-${proofId}${ext || '.bin'}`;
  res.setHeader('Content-Disposition', `inline; filename="${safeName.replace(/"/g, '\\"')}"`);
  const stream = fs.createReadStream(absolutePath);
  stream.on('error', () => {
    if (!res.headersSent) res.status(500).end();
    else res.end();
  });
  stream.pipe(res);
}

export async function approveProof(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const adminId = req.user.id;
  const proofId = Number(req.params.id);
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket?.remoteAddress ?? null;
  const result = await manualPaymentService.approveProof(adminId, proofId, ip);
  return sendSuccess(res, result, 200, 'Payment approved; delivery processing started');
}

export async function rejectProof(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const adminId = req.user.id;
  const proofId = Number(req.params.id);
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket?.remoteAddress ?? null;
  const proof = await manualPaymentService.rejectProof(adminId, proofId, ip);
  return sendSuccess(res, { proof }, 200, 'Payment proof rejected');
}
