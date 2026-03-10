import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: unknown = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
} else if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue || {})[0];
    statusCode = 409;
    message = `${field ? `"${field}"` : 'A field'} already exists with that value`;
  }

  if (statusCode === 500) logger.error('Unhandled error:', err);

  res.status(statusCode).json({
    success: false,
    message,
    ...(typeof errors === 'object' && errors !== null ? { errors } : {}),
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}

export default errorHandler;