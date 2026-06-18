import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { app, flushRedis, disconnectRedis, registerUser } from './helpers';
import request from 'supertest';

const VALID_USERNAME = 'testuser';
const VALID_PASSWORD = 'Tr0ub4dor&3correct-horse';

beforeEach(async () => {
  await flushRedis();
});

afterAll(async () => {
  await disconnectRedis();
});

describe('POST /user/register', () => {
  describe('happy path', () => {
    it('returns 201 with a success message', async () => {
      const res = await registerUser(VALID_USERNAME, VALID_PASSWORD);
      expect(res.status).toBe(201);
      expect(res.body).toEqual({ message: 'User registered successfully.' });
    });

    it('includes x-request-id in response headers', async () => {
      const res = await registerUser(VALID_USERNAME, VALID_PASSWORD);
      expect(res.headers['x-request-id']).toBeDefined();
    });

    it('accepts username at min length boundary (3 chars)', async () => {
      const res = await registerUser('abc', VALID_PASSWORD);
      expect(res.status).toBe(201);
    });

    it('accepts username at max length boundary (32 chars)', async () => {
      const res = await registerUser('a'.repeat(32), VALID_PASSWORD);
      expect(res.status).toBe(201);
    });
  });

  describe('duplicate username', () => {
    it('returns 409 USERNAME_TAKEN when registering the same username twice', async () => {
      await registerUser(VALID_USERNAME, VALID_PASSWORD);
      const res = await registerUser(VALID_USERNAME, VALID_PASSWORD);
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('USERNAME_TAKEN');
      expect(res.body.requestId).toBeDefined();
    });
  });

  describe('weak password', () => {
    it.each([
      ['too short', 'short'],
      ['common word padded', 'password1234'],
      ['repeated characters', 'aaaaaaaaaaaa'],
      ['keyboard walk', 'qwertyuiopas'],
    ])('returns 400 WEAK_PASSWORD for %s', async (_, password) => {
      const res = await registerUser(VALID_USERNAME, password);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('WEAK_PASSWORD');
      expect(res.body.requestId).toBeDefined();
    });
  });

  describe('validation errors', () => {
    it.each([
      ['missing body', {}],
      ['missing username', { password: VALID_PASSWORD }],
      ['missing password', { username: VALID_USERNAME }],
    ])('returns 400 VALIDATION_ERROR for %s', async (_, body) => {
      const res = await request(app).post('/user/register').send(body);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it.each([
      ['too short (2 chars)', 'ab'],
      ['too long (33 chars)', 'a'.repeat(33)],
      ['invalid characters', 'user name!'],
    ])('returns 400 VALIDATION_ERROR for username %s', async (_, username) => {
      const res = await registerUser(username, VALID_PASSWORD);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });
  });
});