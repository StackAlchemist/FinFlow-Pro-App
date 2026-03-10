import { Request, Response } from 'express';
import { AppError, catchAsync } from '../utils/errors';
import User from '../models/user.model';
import Wallet from '../models/wallet.model';
import jwt from 'jsonwebtoken';
import { sendSuccess, sendError } from '../utils/response';
import { UserRole, Currency, WalletType, SubWalletLabel } from '../types';


const signToken = (userId: string, email: string, role: UserRole): string => { 
    const secret = process.env.JWT_SECRET!;
    if (!secret) throw new AppError('JWT secret not configured', 500);
    const expiresIn = process.env.JWT_EXPIRES_IN || '2d';
    return jwt.sign({ userId, email, role }, secret, { expiresIn } as jwt.SignOptions);
};

const createDefaultWallets = async (userId: string, role: UserRole): Promise<void> => {
    const wallets = [
        // every user gets a main wallet dollar and naira
        { owner: userId, currency: Currency.NGN, type: WalletType.MAIN },
        { owner: userId, currency: Currency.USD, type: WalletType.MAIN },
    ];

    const created = await Wallet.insertMany(wallets);

    if (role === UserRole.BUSINESS) {
        // business users get a sub wallet for naira
        const ngnMain = created.find( wallet => wallet.currency === Currency.NGN && wallet.type === WalletType.MAIN);

        if (ngnMain) {
            await Wallet.insertMany([
                {
                    owner: userId,
                    currency: Currency.NGN,
                    type: WalletType.SUB,
                    parentWallet: ngnMain._id,
                    label: SubWalletLabel.SALES,
                },
                {
                    owner: userId,
                    currency: Currency.NGN,
                    type: WalletType.SUB,
                    parentWallet: ngnMain._id,
                    label: SubWalletLabel.PAYROLL,
                },
                {
                    owner: userId,
                    currency: Currency.NGN,
                    type: WalletType.SUB,
                    parentWallet: ngnMain._id,
                    label: SubWalletLabel.SAVINGS,
                },
            ])
        }
    }
}


export const register = catchAsync(async (req: Request, res: Response) => {
    const {
        firstName,
        lastName,
        email,
        password,
        phone,
        role,
        businessName,
        businessRegNumber,
    } = req.body;

    // CHECK IF USER ALREADY EXISTS
    const existingUser = await User.findOne({ email });
    if (existingUser) return sendError(res, 'An account with this email already exists', 400);

    // validate business fields if registering as business
    const userRole = role === UserRole.BUSINESS ? UserRole.BUSINESS : UserRole.USER;
    if (role === UserRole.BUSINESS && !businessName) {
        return sendError(res, 'Business name is required for business accounts', 400);
    }

    // create user
    const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        phone,
        role: userRole,
        ...(userRole === UserRole.BUSINESS && { businessName, businessRegNumber }),
    });

    await createDefaultWallets(user._id.toString(), userRole);

    const token = signToken(user._id.toString(), email, userRole);

    return sendSuccess(
        res, 
        'Account created successfully', 
        { user,token }, 
        201
    );
});


// login
export const login = catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }
  
    // Explicitly select password since it's select: false on the schema
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }
  
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return sendError(res, 'Invalid email or password', 401);
    }
  
    // Update last login timestamp
    user.lastLoginAt = new Date();
    await user.save();
  
    const token = signToken(user._id.toString(), user.email, user.role);
  
    // Remove password from response
    const userObj = user.toJSON();
  
    return sendSuccess(res, 'Login successful', { user: userObj, token });
  });


//   get current user
export const getMe = catchAsync(async (req: Request, res: Response) => {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
  
    return sendSuccess(res, 'User retrieved successfully', { user });
  });