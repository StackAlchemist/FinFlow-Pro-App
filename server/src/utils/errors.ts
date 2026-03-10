import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const catchAsync =
  (fn: AsyncFn) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export const notFound  = (resource = 'Resource') => new AppError(`${resource} not found`, 404);
export const unauthorized = (msg = 'Unauthorized')  => new AppError(msg, 401);
export const forbidden    = (msg = 'Forbidden')     => new AppError(msg, 403);
export const badRequest   = (msg: string)           => new AppError(msg, 400);
export const conflict     = (msg: string)           => new AppError(msg, 409);