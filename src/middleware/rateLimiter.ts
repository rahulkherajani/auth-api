import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const requestId = (req.headers['x-request-id'] as string) ?? 'unknown';
    res.status(429).json({
      error: 'RATE_LIMITED',
      message: 'Too many requests, please try again later.',
      requestId,
    });
  },
});
