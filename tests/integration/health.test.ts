import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './helpers';

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('includes x-request-id in response headers', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('echoes a provided x-request-id', async () => {
    const id = 'test-request-id-123';
    const res = await request(app).get('/health').set('x-request-id', id);
    expect(res.headers['x-request-id']).toBe(id);
  });
});