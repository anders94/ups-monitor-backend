import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config/env';
import logger from './config/logger';
import { errorHandler, notFoundHandler } from './api/middleware/error.middleware';
import { defaultRateLimiter } from './api/middleware/rateLimiter.middleware';
import devicesRoutes from './api/routes/devices.routes';
import metricsRoutes from './api/routes/metrics.routes';
import healthRoutes from './api/routes/health.routes';
import { randomBytes } from 'crypto';

// Request ID generation
function generateRequestId(): string {
  return randomBytes(16).toString('hex');
}

export function createServer(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration (for internal dashboard)
  app.use(
    cors({
      origin: config.app.isDevelopment ? '*' : [], // Configure allowed origins for production
      credentials: true,
    })
  );

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request ID middleware
  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as any).requestId = generateRequestId();
    next();
  });

  // Request logging
  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.info('Incoming request', {
      requestId: (req as any).requestId,
      method: req.method,
      path: req.path,
      ip: req.ip,
    });
    next();
  });

  // Rate limiting
  if (config.app.isProduction) {
    app.use('/api/', defaultRateLimiter);
  }

  // API routes
  app.use('/api/v1/devices', devicesRoutes);
  app.use('/api/v1', metricsRoutes);
  app.use('/api/v1', healthRoutes);

  // Root endpoint
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'UPS Monitor API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/api/v1/health',
        stats: '/api/v1/stats',
        devices: '/api/v1/devices',
        metrics: '/api/v1/devices/:id/metrics/power',
        batteryEvents: '/api/v1/devices/:id/battery-events',
      },
    });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}

export default createServer;
