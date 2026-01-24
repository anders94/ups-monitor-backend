import { Router } from 'express';
import metricsController from '../controllers/metrics.controller';
import { validateParams, validateQuery } from '../middleware/validation.middleware';
import {
  deviceIdSchema,
  metricsQuerySchema,
  batteryEventsQuerySchema,
} from '../validators/metrics.validator';

const router = Router();

/**
 * GET /api/v1/devices/:id/metrics/power
 * Get power metrics (watts, load %) for a device
 */
router.get(
  '/devices/:id/metrics/power',
  validateParams(deviceIdSchema),
  validateQuery(metricsQuerySchema),
  metricsController.getPowerMetrics.bind(metricsController)
);

/**
 * GET /api/v1/devices/:id/metrics/battery
 * Get battery metrics (capacity, runtime, voltage) for a device
 */
router.get(
  '/devices/:id/metrics/battery',
  validateParams(deviceIdSchema),
  validateQuery(metricsQuerySchema),
  metricsController.getBatteryMetrics.bind(metricsController)
);

/**
 * GET /api/v1/devices/:id/battery-events
 * Get battery events (on-battery times) for a device
 */
router.get(
  '/devices/:id/battery-events',
  validateParams(deviceIdSchema),
  validateQuery(batteryEventsQuerySchema),
  metricsController.getBatteryEvents.bind(metricsController)
);

/**
 * GET /api/v1/devices/:id/status/current
 * Get current/latest status for a device
 */
router.get(
  '/devices/:id/status/current',
  validateParams(deviceIdSchema),
  metricsController.getCurrentStatus.bind(metricsController)
);

/**
 * GET /api/v1/metrics/power/total
 * Get aggregated power metrics across multiple devices
 */
router.get(
  '/metrics/power/total',
  metricsController.getTotalPowerMetrics.bind(metricsController)
);

/**
 * GET /api/v1/battery-events
 * Get battery events across multiple devices
 */
router.get(
  '/battery-events',
  metricsController.getAllBatteryEvents.bind(metricsController)
);

export default router;
