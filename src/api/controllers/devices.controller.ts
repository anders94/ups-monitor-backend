import { Request, Response, NextFunction } from 'express';
import deviceService from '../../services/device.service';
import metricsService from '../../services/metrics.service';
import { NotFoundError } from '../../utils/errors';

export class DevicesController {
  /**
   * GET /api/v1/devices
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const devices = await deviceService.getAllDevices();

      res.json({
        success: true,
        data: devices,
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
   * GET /api/v1/devices/:id
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deviceId = parseInt(req.params.id, 10);
      const device = await deviceService.getDeviceById(deviceId);

      if (!device) {
        throw new NotFoundError('Device', deviceId);
      }

      // Get latest metrics
      const latestMetric = await metricsService.getLatestMetric(deviceId);

      res.json({
        success: true,
        data: {
          device,
          latestMetric,
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
   * POST /api/v1/devices
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const device = await deviceService.createDevice(req.body);

      res.status(201).json({
        success: true,
        data: device,
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
   * PUT /api/v1/devices/:id
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deviceId = parseInt(req.params.id, 10);
      const device = await deviceService.updateDevice(deviceId, req.body);

      res.json({
        success: true,
        data: device,
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
   * DELETE /api/v1/devices/:id
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deviceId = parseInt(req.params.id, 10);
      await deviceService.deleteDevice(deviceId);

      res.json({
        success: true,
        data: {
          message: 'Device deleted successfully',
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
   * POST /api/v1/devices/:id/test
   */
  async testConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deviceId = parseInt(req.params.id, 10);
      const success = await deviceService.testDeviceConnection(deviceId);

      res.json({
        success: true,
        data: {
          connected: success,
          message: success ? 'Connection successful' : 'Connection failed',
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
}

export default new DevicesController();
