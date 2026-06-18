import { RedisContainer } from '@testcontainers/redis';

export async function setup() {
  const container = await new RedisContainer('redis:7').start();
  process.env['REDIS_URL'] = container.getConnectionUrl();

  return async () => {
    await container.stop();
  };
}