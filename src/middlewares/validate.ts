import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { sendError } from '../utils/apiResponse';

/**
 * Runs express-validator chains and returns 400 with validation errors if any.
 * Use after validators in route definitions.
 */
export function validate(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(validations.map((v) => v.run(req)));
    const result = validationResult(req);
    if (result.isEmpty()) {
      return next();
    }
    const errors = result.array().map((e) => ({
      field: 'path' in e ? e.path : ('param' in e ? e.param : 'field'),
      message: e.msg,
    }));
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: errors.length === 1 ? errors[0].message : 'Invalid request',
      errors,
    });
  };
}
