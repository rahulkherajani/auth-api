import express from 'express';
import { requestId } from './middleware/requestId';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { userRouter } from './routes/user.routes';

export const createApp = (): express.Application => {
  const app = express();

  // Prevents payload based DoS attacks
  app.use(express.json({ limit: '10kb' }));

  // RequestId Middleware is used first
  app.use(requestId);

  app.use(rateLimiter);

  app.use('/user', userRouter);

  app.get('/health', (_, res) => res.status(200).json({ status: 'ok' }));

  app.use(errorHandler);

  return app;
};
