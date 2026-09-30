import cors from 'cors';
import express from 'express';
import { CLIENT_ORIGINS } from './env.js';
import { errorHandler, notFoundHandler, requestLogger } from './middleware/error.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import leadsRoutes from './routes/leadsRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

/**
 * LeadTrack API application factory.
 *
 * CORS is scoped to the configured allowlist (CLIENT_ORIGIN env var) rather
 * than "*" so the API is only reachable from the frontend origin(s) we own.
 * Auth (register/login) is public; leads and dashboard are protected.
 */
export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  app.use(
    cors({
      origin(origin, callback) {
        // No Origin header (curl, server-to-server) -> allow.
        if (!origin || CLIENT_ORIGINS.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
    }),
  );

  app.use(express.json());

  if (process.env.NODE_ENV !== 'test') {
    app.use(requestLogger);
  }

  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/leads', leadsRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}