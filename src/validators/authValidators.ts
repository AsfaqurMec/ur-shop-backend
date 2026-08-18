import { body, query } from 'express-validator';

const PASSWORD_MIN = 8;
const NAME_MAX = 255;

export const registerValidator = [
  body('identifier').trim().notEmpty().withMessage('Email or mobile number is required'),
  body('password')
    .isLength({ min: PASSWORD_MIN })
    .withMessage(`Password must be at least ${PASSWORD_MIN} characters`),
  body('name').optional().trim().isLength({ max: NAME_MAX }).withMessage(`Name max ${NAME_MAX} characters`),
];

export const loginValidator = [
  body('identifier').trim().notEmpty().withMessage('Email or mobile number is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const refreshValidator = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];

export const verifyEmailValidator = [
  body('token').notEmpty().withMessage('Verification token is required'),
];

export const verifyEmailQueryValidator = [
  query('token').notEmpty().withMessage('Verification token is required'),
];

export const forgotPasswordValidator = [
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required'),
];

export const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: PASSWORD_MIN })
    .withMessage(`Password must be at least ${PASSWORD_MIN} characters`),
];

export const updateProfileValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: NAME_MAX })
    .withMessage(`Name max ${NAME_MAX} characters`),
  body('mobile').optional({ values: 'null' }).trim().isLength({ max: 32 }).withMessage('Mobile max 32 characters'),
  body('address').optional({ values: 'null' }).trim().isLength({ max: 1000 }).withMessage('Address max 1000 characters'),
];

export const guestCheckoutValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: NAME_MAX }),
  body('mobile').trim().notEmpty().withMessage('Mobile number is required').isLength({ max: 32 }),
  body('address').trim().notEmpty().withMessage('Address is required').isLength({ max: 1000 }),
];

export const changePasswordValidator = [
  body('current_password').notEmpty().withMessage('Current password is required'),
  body('new_password').isLength({ min: PASSWORD_MIN }).withMessage(`New password must be at least ${PASSWORD_MIN} characters`),
];
