import { body } from 'express-validator';

const PASSWORD_MIN = 8;
const NAME_MAX = 255;

export const changeAdminPasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: PASSWORD_MIN })
    .withMessage(`New password must be at least ${PASSWORD_MIN} characters`),
];

export const createAdminValidator = [
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: PASSWORD_MIN })
    .withMessage(`Password must be at least ${PASSWORD_MIN} characters`),
  body('name').optional().trim().isLength({ max: NAME_MAX }).withMessage(`Name max ${NAME_MAX} characters`),
];
