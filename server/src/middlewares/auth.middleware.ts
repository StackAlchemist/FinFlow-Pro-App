import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthPayload, UserRole, AccountStatus } from '../types';
import { AppError, unauthorized, forbidden } from '../utils/errors';
import User from '../models/user.model';

export const protect = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(unauthorized('No token provided'));
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) throw new AppError('JWT secret not configured', 500);

    const decoded = jwt.verify(token, secret) as AuthPayload;

    const user = await User.findById(decoded.userId).select('status role email');
    if (!user) return next(unauthorized('User no longer exists'));

    if (user.status === AccountStatus.FROZEN) {
      return next(forbidden('Your account has been frozen. Contact support.'));
    }

    if (user.status === AccountStatus.SUSPENDED) {
      return next(forbidden('Your account has been suspended.'));
    }

    req.user = { userId: decoded.userId, email: decoded.email, role: user.role };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(unauthorized('Token expired. Please log in again.'));
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return next(unauthorized('Invalid token.'));
    }
    next(err);
  }
};

export const restrictTo =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role as UserRole)) {
      return next(forbidden('You do not have permission to perform this action.'));
    }
    next();
  };

export const adminOnly = restrictTo(UserRole.ADMIN);
export const businessOrAdmin = restrictTo(UserRole.BUSINESS, UserRole.ADMIN);