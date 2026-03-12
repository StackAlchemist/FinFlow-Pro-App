import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller';
import { protect } from '../middlewares/auth.middleware';
import { body } from 'express-validator';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();

// ─── Validation Rules ─────────────────────────────────────────────────────────

const registerRules = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),

  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),

  body('phone')
    .optional()
    .isMobilePhone('any').withMessage('Please enter a valid phone number'),

  body('role')
    .optional()
    .isIn(['user', 'business']).withMessage('Role must be user or business'),

  body('businessName')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Business name cannot exceed 100 characters'),
];

const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

router.post('/register', registerRules, validateRequest, register);
router.post('/login',    loginRules,    validateRequest, login);
router.get('/me',        protect,       getMe);

export default router;