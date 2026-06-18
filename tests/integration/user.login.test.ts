import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app, flushRedis, disconnectRedis, registerUser, loginUser } from './helpers';

const USERNAME = 'testuser';
const PASSWORD = 'Tr0ub4dor&3correct-horse';

beforeEach(async () => {
  await flushRedis();
  await registerUser(USERNAME, PASSWORD);
});

afterAll(async () => {
  await disconnectRedis();
});

describe('POST /user/login', () => {
  describe('happy path', () => {
    it('returns 200 with accessToken, refreshToken, and expiresIn', async () => {
      const res = await loginUser(USERNAME, PASSWORD);
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(typeof res.body.expiresIn).toBe('number');
    });

    it('includes x-request-id in response headers', async () => {
      const res = await loginUser(USERNAME, PASSWORD);
      expect(res.headers['x-request-id']).toBeDefined();
    });
  });

  describe('invalid credentials', () => {
    it('returns 401 INVALID_CREDENTIALS for wrong password', async () => {
      const res = await loginUser(USERNAME, 'wrong-password');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('INVALID_CREDENTIALS');
      expect(res.body.requestId).toBeDefined();
    });

    it('returns 401 INVALID_CREDENTIALS for non-existent user', async () => {
      const res = await loginUser('nobody', 'wrong-password');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('INVALID_CREDENTIALS');
    });

    it('returns identical response shape for wrong password and non-existent user (no enumeration)', async () => {
      const wrongPassword = await loginUser(USERNAME, 'wrong-password');
      const noUser = await loginUser('nobody', 'wrong-password');
      expect(wrongPassword.body.error).toBe(noUser.body.error);
      expect(wrongPassword.body.message).toBe(noUser.body.message);
      expect(wrongPassword.status).toBe(noUser.status);
    });
  });

  describe('account lockout', () => {
    it('returns 429 ACCOUNT_LOCKED after exceeding the failure threshold', async () => {
      for (let i = 0; i < 5; i++) {
        await loginUser(USERNAME, 'wrong-password');
      }
      const res = await loginUser(USERNAME, 'wrong-password');
      expect(res.status).toBe(429);
      expect(res.body.error).toBe('ACCOUNT_LOCKED');
    });

    it('returns 429 ACCOUNT_LOCKED even with correct password while locked', async () => {
      for (let i = 0; i < 5; i++) {
        await loginUser(USERNAME, 'wrong-password');
      }
      const res = await loginUser(USERNAME, PASSWORD);
      expect(res.status).toBe(429);
      expect(res.body.error).toBe('ACCOUNT_LOCKED');
    });
  });

  describe('validation errors', () => {
    it.each([
      ['missing body', {}],
      ['missing username', { password: PASSWORD }],
      ['missing password', { username: USERNAME }],
    ])('returns 400 VALIDATION_ERROR for %s', async (_, body) => {
      const res = await request(app).post('/user/login').send(body);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });
  });
});