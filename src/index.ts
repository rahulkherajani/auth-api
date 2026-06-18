import { env } from './config/env';
import { getRedisClient, closeRedisClient } from './config/redis';
import { createApp } from './app';
import { logger } from './utils/logger';

const main = async (): Promise<void> => {
  // Eagerly connect Redis so the first request doesn't incur connection latency
  const redisClient = getRedisClient();
  await redisClient.connect();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Auth api started');
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutting down');
    server.close(async () => {
      await closeRedisClient();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

main().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
