import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse';
import * as paymentOptionService from '../services/paymentOptionService';

export async function list(req: Request, res: Response): Promise<Response> {
  const options = await paymentOptionService.listAllForAdmin();
  return sendSuccess(res, { payment_options: options });
}

export async function create(req: Request, res: Response): Promise<Response> {
  const body = req.body as paymentOptionService.CreatePaymentOptionBody;
  const option = await paymentOptionService.createOption(body);
  return sendSuccess(res, { payment_option: option }, 201, 'Payment option created');
}

export async function update(req: Request, res: Response): Promise<Response> {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id < 1) return sendError(res, 'Invalid id', 400);
  const option = await paymentOptionService.updateOption(id, req.body);
  return sendSuccess(res, { payment_option: option }, 200, 'Payment option updated');
}

export async function remove(req: Request, res: Response): Promise<Response> {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id < 1) return sendError(res, 'Invalid id', 400);
  await paymentOptionService.removeOption(id);
  return sendSuccess(res, {}, 200, 'Payment option deleted');
}
