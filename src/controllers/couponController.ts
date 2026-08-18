import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse';
import * as couponService from '../services/couponService';

export async function list(req: Request, res: Response): Promise<Response> {
  const coupons = await couponService.list();
  return sendSuccess(res, { coupons });
}

export async function getById(req: Request, res: Response): Promise<Response> {
  const id = Number(req.params.id);
  const coupon = await couponService.getById(id);
  return sendSuccess(res, { coupon });
}

export async function create(req: Request, res: Response): Promise<Response> {
  const body = req.body;
  const coupon = await couponService.create({
    code: body.code,
    type: body.type,
    value: body.value,
    min_order_amount: body.min_order_amount,
    max_uses: body.max_uses,
    max_uses_per_user: body.max_uses_per_user,
    valid_from: body.valid_from,
    valid_until: body.valid_until,
    is_active: body.is_active,
    product_ids: body.product_ids,
    category_ids: body.category_ids,
  });
  return sendSuccess(res, { coupon }, 201);
}

export async function update(req: Request, res: Response): Promise<Response> {
  const id = Number(req.params.id);
  const body = req.body;
  const coupon = await couponService.update(id, {
    code: body.code,
    type: body.type,
    value: body.value,
    min_order_amount: body.min_order_amount,
    max_uses: body.max_uses,
    max_uses_per_user: body.max_uses_per_user,
    valid_from: body.valid_from,
    valid_until: body.valid_until,
    is_active: body.is_active,
    product_ids: body.product_ids,
    category_ids: body.category_ids,
  });
  return sendSuccess(res, { coupon });
}

export async function setActive(req: Request, res: Response): Promise<Response> {
  const id = Number(req.params.id);
  const isActive = req.body.is_active === true;
  const coupon = await couponService.setActive(id, isActive);
  return sendSuccess(res, { coupon }, 200, isActive ? 'Coupon enabled' : 'Coupon disabled');
}

export async function remove(req: Request, res: Response): Promise<Response> {
  const id = Number(req.params.id);
  await couponService.remove(id);
  return sendSuccess(res, {}, 200, 'Coupon deleted');
}

export async function validate(req: Request, res: Response): Promise<Response> {
  const userId = req.user?.id ?? null;
  const { code, subtotal, items } = req.body;
  const result = await couponService.validateCoupon(code, userId, subtotal, items);
  return sendSuccess(res, result);
}
