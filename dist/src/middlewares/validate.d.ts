import { Request, Response, NextFunction } from 'express';
import { ValidationChain } from 'express-validator';
/**
 * Runs express-validator chains and returns 400 with validation errors if any.
 * Use after validators in route definitions.
 */
export declare function validate(validations: ValidationChain[]): (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=validate.d.ts.map