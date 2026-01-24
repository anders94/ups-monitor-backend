import { Request, Response, NextFunction } from 'express';
import db from '../../config/database';
import snmpCollector from '../../collectors/snmp.collector';
import deviceService from '../../services/device.service';
import metricsService from '../../services/metrics.service';
import { HealthStatus, SystemStats } from '../../types/api.types';

export class HealthController {
  /**
   * GET /api/v1/health
   */
  async getHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const startTime = Date.now();

      // Test database connection
      const dbConnected = await db.testConnection();
      const dbResponseTime = Date.now() - startTime;

      // Get collector status
      const lastPollAt = snmpCollector.getLastPollTime();
      const deviceStats = await deviceService.getDeviceStatistics();

      const status: HealthStatus = {
        status: dbConnected ? 'healthy' : 'unhealthy',
        database: {
          connected: dbConnected,
          responseTimeMs: dbResponseTime,
        },
        collector: {
          lastPollAt,
          activeDevices: parseInt(deviceStats.enabled, 10),
          failedDevices: parseInt(deviceStats.failing, 10),
        },
        uptime: process.uptime(),
      };

      // Determine overall status
      if (!dbConnected) {
        status.status = 'unhealthy';
      } else if (deviceStats.failing > 0) {
        status.status = 'degraded';
      }

      const statusCode = status.status === 'healthy' ? 200 : 503;

      res.status(statusCode).json({
        success: status.status !== 'unhealthy',
        data: status,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).requestId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/stats
   */
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deviceStats = await deviceService.getDeviceStatistics();
      const metricsStats = await metricsService.getMetricsStatistics();

      // Get database size (optional, may not work on all PostgreSQL setups)
      let dbSize: number | undefined;
      try {
        const result = await db.query(`
          SELECT pg_database_size(current_database()) as size
        `);
        dbSize = parseInt(result.rows[0].size, 10);
      } catch (error) {
        // Ignore if unable to get database size
      }

      const stats: SystemStats = {
        devices: {
          total: parseInt(deviceStats.total, 10),
          enabled: parseInt(deviceStats.enabled, 10),
          disabled: parseInt(deviceStats.disabled, 10),
          healthy: parseInt(deviceStats.healthy, 10),
          failing: parseInt(deviceStats.failing, 10),
        },
        metrics: {
          rawCount: parseInt(metricsStats.raw_count, 10),
          aggregatedCount: parseInt(metricsStats.aggregated_count, 10),
          oldestRaw: metricsStats.oldest_raw ? new Date(metricsStats.oldest_raw) : undefined,
          newestRaw: metricsStats.newest_raw ? new Date(metricsStats.newest_raw) : undefined,
        },
        database: {
          sizeBytes: dbSize,
          sizeMb: dbSize ? Math.round(dbSize / 1024 / 1024 * 100) / 100 : undefined,
        },
      };

      res.json({
        success: true,
        data: stats,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).requestId,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new HealthController();
