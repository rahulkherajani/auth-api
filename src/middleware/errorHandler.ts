import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _: NextFunction,
): void => {
  const requestId = (req.headers['x-request-id'] as string) ?? 'unknown';

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      requestId,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: err.issues.map((i) => i.message).join('; '),
      requestId,
    });
    return;
  }

  // Log the unhandled errors, since they are not expected, and worth investigating
  logger.error({ err, requestId }, 'Unhandled error');
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred.',
    requestId,
  });
};
