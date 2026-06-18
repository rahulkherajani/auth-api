import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { authenticateUser, createUser } from '../services/user.service';
import { issueTokens } from '../services/token.service';

const registerUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters.')
    .max(32, 'Username must be at most 32 characters.')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username may only contain letters, numbers, _ and -.',
    ),
  password: z.string().min(1, 'Password is required.'),
});

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { username, password } = registerUserSchema.parse(req.body);
    await createUser(username, password);
    logger.info({ username, requestId: req.headers['x-request-id'] }, 'User registered');
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    next(err);
  }
};

const loginUserSchema = z.object({
  username: z.string().min(1, 'Username is required.'),
  password: z.string().min(1, 'Password is required.'),
});

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { username, password } = loginUserSchema.parse(req.body);
    await authenticateUser(username, password);
    const tokens = await issueTokens(username);
    logger.info({ username, requestId: req.headers['x-request-id'] }, 'User logged in');
    res.status(200).json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    });
  } catch (err) {
    next(err);
  }
};
