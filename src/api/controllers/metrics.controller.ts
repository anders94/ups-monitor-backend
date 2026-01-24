import { Request, Response, NextFunction } from 'express';
import metricsService from '../../services/metrics.service';
import eventsRepository from '../../repositories/events.repository';
import deviceService from '../../services/device.service';
import { NotFoundError, ValidationError } from '../../utils/errors';

export class MetricsController {
  /**
   * GET /api/v1/devices/:id/metrics/power
   */
  async getPowerMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deviceId = parseInt(req.params.id, 10);

      // Verify device exists
      const device = await deviceService.getDeviceById(deviceId);
      if (!device) {
        throw new NotFoundError('Device', deviceId);
      }

      // Parse query parameters
      const start = req.query.start ? new Date(req.query.start as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const end = req.query.end ? new Date(req.query.end as string) : new Date();
      const interval = req.query.interval ? parseInt(req.query.interval as string, 10) : undefined;

      const metrics = await metricsService.getPowerMetrics(deviceId, start, end, interval);

      res.json({
        success: true,
        data: metrics,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).requestId,
          query: { start, end, interval },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/devices/:id/metrics/battery
   */
  async getBatteryMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deviceId = parseInt(req.params.id, 10);

      // Verify device exists
      const device = await deviceService.getDeviceById(deviceId);
      if (!device) {
        throw new NotFoundError('Device', deviceId);
      }

      // Parse query parameters
      const start = req.query.start ? new Date(req.query.start as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const end = req.query.end ? new Date(req.query.end as string) : new Date();
      const interval = req.query.interval ? parseInt(req.query.interval as string, 10) : undefined;

      const metrics = await metricsService.getBatteryMetrics(deviceId, start, end, interval);

      res.json({
        success: true,
        data: metrics,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).requestId,
          query: { start, end, interval },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/devices/:id/battery-events
   */
  async getBatteryEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deviceId = parseInt(req.params.id, 10);

      // Verify device exists
      const device = await deviceService.getDeviceById(deviceId);
      if (!device) {
        throw new NotFoundError('Device', deviceId);
      }

      // Parse query parameters
      const start = req.query.start ? new Date(req.query.start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = req.query.end ? new Date(req.query.end as string) : new Date();
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

      const events = await eventsRepository.getBatteryEvents(deviceId, start, end, limit);

      res.json({
        success: true,
        data: events,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).requestId,
          query: { start, end, limit },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/devices/:id/status/current
   */
  async getCurrentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deviceId = parseInt(req.params.id, 10);

      // Verify device exists
      const device = await deviceService.getDeviceById(deviceId);
      if (!device) {
        throw new NotFoundError('Device', deviceId);
      }

      const latestMetric = await metricsService.getLatestMetric(deviceId);

      res.json({
        success: true,
        data: {
          device: {
            id: device.id,
            name: device.name,
            enabled: device.enabled,
            lastPollAt: device.lastPollAt,
            lastPollSuccess: device.lastPollSuccess,
          },
          currentMetric: latestMetric,
        },
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
   * GET /api/v1/metrics/power/total
   */
  async getTotalPowerMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Parse device IDs
      const deviceIdsParam = req.query.deviceIds;
      if (!deviceIdsParam) {
        throw new ValidationError('deviceIds parameter is required');
      }

      const deviceIds = Array.isArray(deviceIdsParam)
        ? deviceIdsParam.map((id) => parseInt(id as string, 10))
        : [parseInt(deviceIdsParam as string, 10)];

      // Parse query parameters
      const start = req.query.start ? new Date(req.query.start as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const end = req.query.end ? new Date(req.query.end as string) : new Date();
      const interval = req.query.interval ? parseInt(req.query.interval as string, 10) : undefined;

      const metrics = await metricsService.getTotalPowerMetrics(deviceIds, start, end, interval);

      res.json({
        success: true,
        data: metrics,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).requestId,
          query: { deviceIds, start, end, interval },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/battery-events
   */
  async getAllBatteryEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Parse device IDs
      const deviceIdsParam = req.query.deviceIds;
      if (!deviceIdsParam) {
        throw new ValidationError('deviceIds parameter is required');
      }

      const deviceIds = Array.isArray(deviceIdsParam)
        ? deviceIdsParam.map((id) => parseInt(id as string, 10))
        : [parseInt(deviceIdsParam as string, 10)];

      // Parse query parameters
      const start = req.query.start ? new Date(req.query.start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = req.query.end ? new Date(req.query.end as string) : new Date();
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

      const events = await eventsRepository.getMultiDeviceBatteryEvents(deviceIds, start, end, limit);

      res.json({
        success: true,
        data: events,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).requestId,
          query: { deviceIds, start, end, limit },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MetricsController();
