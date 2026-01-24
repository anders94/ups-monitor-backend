import { createServer } from './server';
import { config } from './config/env';
import db from './config/database';
import scheduler from './collectors/scheduler';
import logger from './config/logger';

async function start() {
  try {
    logger.info('Starting UPS Monitor API');

    // Test database connection
    const dbConnected = await db.testConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database');
      process.exit(1);
    }

    // Create and start Express server
    const app = createServer();
    const server = app.listen(config.app.port, () => {
      logger.info(`Server listening on port ${config.app.port}`, {
        environment: config.app.env,
        port: config.app.port,
      });
    });

    // Start scheduler (SNMP polling, aggregation, retention)
    scheduler.start();

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');

      // Stop scheduler
      scheduler.stop();

      // Close HTTP server
      server.close(() => {
        logger.info('HTTP server closed');
      });

      // Close database connections
      await db.close();

      logger.info('Shutdown complete');
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack,
      });
      shutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', {
        reason,
        promise,
      });
    });
  } catch (error) {
    logger.error('Failed to start application', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
}

start();
