export interface UserRecord {
  passwordHash: string;
  createdAt: string;
  failedAttempts: string;
  lockedUntil: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenPayload {
  sub: string;
  jti: string;
  iat?: number;
  exp?: number;
}
