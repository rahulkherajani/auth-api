import { env } from '../config/env';
import { getRedisClient } from '../config/redis';
import { UserRecord } from '../types';
import { AppError } from '../utils/AppError';
import {
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from '../utils/password';

const DUMMY_HASH =
  '$2a$12$dummyhashfornonexistentuserthatisexactlysixtycharslong12345';

const getUserKey = (username: string): string => `user:${username}`;

export const createUser = async (
  username: string,
  password: string,
): Promise<void> => {
  validatePasswordStrength(password);

  const redisClient = getRedisClient();
  const userKey = getUserKey(username);
  const passwordHash = await hashPassword(password, env.BCRYPT_ROUNDS);

  // Create user entry in Redis
  // Prevents two simulaneous registrations by serializing them,
  // and allowing only one to succeed.
  const created = await redisClient.hsetnx(
    userKey,
    'passwordHash',
    passwordHash,
  );
  if (created === 0) {
    throw new AppError(409, 'USERNAME_TAKEN', 'Username is already taken.');
  }

  await redisClient.hset(userKey, {
    createdAt: Date.now().toString(),
    failedAttempts: '0',
    lockedUntil: '0',
  });
};

export const authenticateUser = async (
  username: string,
  password: string,
): Promise<void> => {
  const redisClient = getRedisClient();
  const userKey = getUserKey(username);

  const userRecord = (await redisClient.hgetall(
    userKey,
  )) as Partial<UserRecord>;

  // Always verify password, even when user doesnot exist (against DUMMY_HASH)
  // Prevents timing based user discovery
  const hash = userRecord.passwordHash ?? DUMMY_HASH;

  const userExists = Boolean(userRecord.passwordHash);

  if (userExists) {
    const lockedUntil = parseInt(userRecord.lockedUntil ?? '0', 10);
    // Convert lockedUntil to milliseconds
    if (lockedUntil > 0 && Date.now() < lockedUntil * 1000) {
      throw new AppError(
        429,
        'ACCOUNT_LOCKED',
        'Account is temporarily locked due to too many failed attempts.',
      );
    }
  }

  const passwordMatch = await verifyPassword(password, hash);

  if (!userExists || !passwordMatch) {
    if (userExists) {
      const attempts = parseInt(userRecord.failedAttempts ?? '0', 10) + 1;
      const updatedUserRecord: Partial<UserRecord> = {
        failedAttempts: attempts.toString(),
      };

      if (attempts >= env.LOCKOUT_THRESHOLD) {
        // lockedUntil stored as Unix epoch seconds
        const lockedUntil =
          Math.floor(Date.now() / 1000) + env.LOCKOUT_DURATION;
        updatedUserRecord['lockedUntil'] = lockedUntil.toString();
      }

      await redisClient.hset(userKey, updatedUserRecord);
    }
    // Identical message for wrong password AND non-existent user — prevents enumeration.
    throw new AppError(
      401,
      'INVALID_CREDENTIALS',
      'Invalid username or password.',
    );
  }

  // Successful login
  await redisClient.hset(userKey, { failedAttempts: '0', lockedUntil: '0' });
};
