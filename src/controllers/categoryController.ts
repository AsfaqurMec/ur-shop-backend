import { Request, Response } from 'express';
import { sendSuccess } from '../utils/apiResponse';
import * as categoryService from '../services/categoryService';

export async function create(req: Request, res: Response): Promise<Response> {
  const { name, slug, description, parent_id, sort_order } = req.body;
  const category = await categoryService.create({
    name,
    slug,
    description,
    parent_id: parent_id ?? undefined,
    sort_order,
  });
  return sendSuccess(res, { category }, 201);
}

export async function update(req: Request, res: Response): Promise<Response> {
  const id = Number(req.params.id);
  const { name, slug, description, parent_id, sort_order } = req.body;
  const category = await categoryService.update(id, {
    name,
    slug,
    description,
    parent_id,
    sort_order,
  });
  return sendSuccess(res, { category });
}

export async function remove(req: Request, res: Response): Promise<Response> {
  const id = Number(req.params.id);
  await categoryService.remove(id);
  return sendSuccess(res, { message: 'Category deleted' });
}

export async function list(req: Request, res: Response): Promise<Response> {
  const nested = req.query.nested === '1' || req.query.nested === 'true';
  if (nested) {
    const categories = await categoryService.list(true);
    return sendSuccess(res, { categories });
  }

  const hasPage = req.query.page != null && req.query.page !== '';
  const hasLimit = req.query.limit != null && req.query.limit !== '';
  if (hasPage || hasLimit) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await categoryService.listPaginated(page, limit);
    return sendSuccess(res, result);
  }

  const categories = await categoryService.list(false);
  return sendSuccess(res, { categories });
}

export async function getBySlug(req: Request, res: Response): Promise<Response> {
  const slug = req.params.slug as string;
  const category = await categoryService.getBySlug(slug);
  return sendSuccess(res, { category });
}
