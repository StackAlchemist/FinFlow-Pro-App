import { Response } from 'express';
import { ApiResponse } from '../types';

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200,
  meta?: ApiResponse['meta']
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data !== undefined && { data }),
    ...(meta && { meta }),
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  data?: unknown
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(data !== undefined && { data }),
  });
};

export const getPaginationMeta = (
  total: number,
  page: number,
  limit: number
): ApiResponse['meta'] => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});