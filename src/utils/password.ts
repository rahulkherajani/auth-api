import bcrypt from 'bcryptjs';
import zxcvbn from 'zxcvbn';
import { AppError } from './AppError';

const MIN_LENGTH = 12;

// 0–4; 3 = "strong"
const MIN_ZXCVBN_SCORE = 3;

export const validatePasswordStrength = (password: string): void => {
  if (password.length < MIN_LENGTH) {
    throw new AppError(
      400,
      'WEAK_PASSWORD',
      `Password must be at least ${MIN_LENGTH} characters.`,
    );
  }

  const result = zxcvbn(password);
  if (result.score < MIN_ZXCVBN_SCORE) {
    const suggestions = result.feedback.suggestions.join(' ');
    throw new AppError(
      400,
      'WEAK_PASSWORD',
      `Password is too weak. ${suggestions}`.trim(),
    );
  }
};

export const hashPassword = (
  password: string,
  rounds: number,
): Promise<string> => bcrypt.hash(password, rounds);

export const verifyPassword = (
  plaintext: string,
  hash: string,
): Promise<boolean> => bcrypt.compare(plaintext, hash);
