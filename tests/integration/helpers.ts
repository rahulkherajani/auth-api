import request from 'supertest';
import { createApp } from '../../src/app';
import { getRedisClient, closeRedisClient } from '../../src/config/redis';

export const app = createApp();

export async function flushRedis() {
  await getRedisClient().flushdb();
}

export async function disconnectRedis() {
  await closeRedisClient();
}

export async function registerUser(username: string, password: string) {
  return request(app).post('/user/register').send({ username, password });
}

export async function loginUser(username: string, password: string) {
  return request(app).post('/user/login').send({ username, password });
}