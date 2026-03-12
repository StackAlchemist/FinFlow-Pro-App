import { Router } from 'express';
import {
  getWallets,
  getWallet,
  fundWallet,
  createSubWallet,
} from '../controllers/wallet.controller';
import { protect, businessOrAdmin } from '../middlewares/auth.middleware';
import { body, param } from 'express-validator';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();

// All wallet routes require authentication
router.use(protect);

// ─── Validation Rules ─────────────────────────────────────────────────────────

const fundRules = [
  param('walletId')
    .isMongoId().withMessage('Invalid wallet ID'),

  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 1 }).withMessage('Amount must be at least 1'),

  body('currency')
    .notEmpty().withMessage('Currency is required')
    .isIn(['NGN', 'USD']).withMessage('Currency must be NGN or USD'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Description too long'),
];

const subWalletRules = [
  body('currency')
    .notEmpty().withMessage('Currency is required')
    .isIn(['NGN', 'USD']).withMessage('Currency must be NGN or USD'),

  body('label')
    .trim()
    .notEmpty().withMessage('Label is required')
    .isLength({ max: 50 }).withMessage('Label too long'),

  body('parentWalletId')
    .notEmpty().withMessage('Parent wallet ID is required')
    .isMongoId().withMessage('Invalid parent wallet ID'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get('/',                       getWallets);
router.get('/:walletId',              getWallet);
router.post('/:walletId/fund',        fundRules,      validateRequest, fundWallet);
router.post('/sub',                   businessOrAdmin, subWalletRules, validateRequest, createSubWallet);

export default router;