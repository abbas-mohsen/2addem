import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

export function createApp() {
  const app = express();

  // Behind a proxy in production so rate limiting sees real client IPs.
  if (env.isProduction) app.set('trust proxy', 1);

  app.use(
    helmet({
      // Uploaded resumes are served from this origin and fetched by the SPA.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Development only: production uses its own access logs, and a test run would
  // bury the reporter under a request line per assertion.
  if (env.NODE_ENV === 'development') app.use(morgan('dev'));

  app.use('/uploads', express.static(env.uploadRoot, { index: false, maxAge: '1h' }));
  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
