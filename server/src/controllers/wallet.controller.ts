import { Request, Response } from 'express';
import Wallet from '../models/wallet.model';
import Transaction from '../models/transaction.model';
import { catchAsync } from '../utils/errors';
import { sendSuccess, sendError } from '../utils/response';
import { Currency, WalletType, TransactionType, TransactionStatus } from '../types';


// Get all wallets

export const getWallets = catchAsync(async (req: Request, res: Response)=>{
    const wallets = await Wallet.find({
        owner: req.user!.userId,
        isActive: true,
    }).sort({ type: 1, currency: 1})

    const mainWallets = wallets.filter((w) => w.type === WalletType.MAIN)
    const subWallets = wallets.filter((w) => w.type === WalletType.SUB)

    return sendSuccess(res, 'Wallets retrieved successfully', {
        mainWallets,
        subWallets,
        totalWallets: wallets.length,
    })
})


// get single wallet

export const getWallet = catchAsync(async (req: Request, res: Response) => {
    const wallet = await Wallet.findOne({
        _id: req.params.walletId,
        owner: req.user!.userId,
        isActive: true,
    })

    if (!wallet) {
        return sendError(res, 'Wallet not found', 404)
    }

    return sendSuccess(res, 'Wallet retrieved successfully', {wallet})
})


// wallet funding simulation
export const fundWallet = catchAsync(async (req: Request, res: Response) => {
    const { walletId } = req.params
    const { amount, currency, description } = req.body

    const amountInKobo = Math.round(amount * 100)

    if (amountInKobo < 100) {
        return sendError(res, 'Minimum funding amount is 1.00', 400 )
    }

    const wallet = await Wallet.findOne({
        _id: walletId,
        owner: req.user!.userId,
        isActive: true,
    })

    if (!wallet) {
        return sendError (res, 'Wallet not found', 404);
    }

    if (wallet.currency !== currency) {
        return sendError(
            res,
            `This wallet only accepts ${wallet.currency}`,
            400
        )
    }

    const balanceBefore = wallet.balance
    wallet.balance += amountInKobo
    await wallet.save()

    const transaction = await Transaction.create({
        type: TransactionType.FUNDING,
    status: TransactionStatus.COMPLETED,
    toWallet: wallet._id,
    toUser: req.user!.userId,
    amount: amountInKobo,
    currency: wallet.currency,
    balanceBeforeTo: balanceBefore,
    balanceAfterTo: wallet.balance,
    description: description || 'Wallet funding',
    metadata: {
      source: 'mock_bank_transfer',
      fundedAt: new Date().toISOString(),
    },
    })

    return sendSuccess(res, 'Wallet funded successfully', {
        wallet,
        transaction,
      });
})


//creating Sub Wallet for business

export const createSubWallet = catchAsync(async (req: Request, res: Response) =>{
    
    const { currency, label, parentWalletId } = req.body
    
    const parentWallet = await Wallet.findOne({
        _id: parentWalletId,
        owner: req.user!.userId,
        type: WalletType.MAIN,
        isActive: true,
    })

    if (!parentWallet) {
        return sendError(res, 'Parent wallet not found', 404)
    }

    if (parentWallet.currency !== currency ) {
        return sendError(
            res,
            `Sub-wallet currency must match parent wallet currency (${parentWallet.currency})`,
            400
        )
    }


    const subWallet = await Wallet.create({
        owner: req.user!.userId,
        currency,
        type: WalletType.SUB,
        label,
        parentWallet: parentWallet._id,
    })

    return sendSuccess(res, `Sub-wallet created successfully`, { wallet: subWallet }, 201)
})