import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthTokens, TokenPayload } from '../types';
import { getRedisClient } from '../config/redis';
import { parseExpiry } from '../utils/token';

// TODO: verifyAccessToken - verify token sent as a part of each request
// TODO: refreshToken — verify refresh token in Redis, issue new pair (rotate session)
// TODO: deleteSession  — delete session:{tokenId} from Redis

export const issueTokens = async (username: string): Promise<AuthTokens> => {
  const tokenId = crypto.randomUUID();
  const payload: TokenPayload = { sub: username, jti: tokenId };
  const signOptions: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    algorithm: 'HS256',
  };
  const accessToken = jwt.sign(payload, env.JWT_SECRET, signOptions);
  const refreshToken = crypto.randomUUID();

  const redisClient = getRedisClient();
  await Promise.all([
    redisClient.set(
      `session:${tokenId}`,
      username,
      'EX',
      env.REFRESH_TOKEN_TTL,
    ),
    redisClient.set(
      `refresh:${refreshToken}`,
      tokenId,
      'EX',
      env.REFRESH_TOKEN_TTL,
    ),
  ]);

  const expiresIn = parseExpiry(env.JWT_EXPIRES_IN);
  return { accessToken, refreshToken, expiresIn };
};
