import { Router } from 'express';
import devicesController from '../controllers/devices.controller';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { createDeviceSchema, updateDeviceSchema, deviceIdSchema } from '../validators/device.validator';
// import { adminAuth } from '../middleware/auth.middleware'; // Uncomment to enable auth

const router = Router();

/**
 * GET /api/v1/devices
 * List all UPS devices
 */
router.get('/', devicesController.getAll.bind(devicesController));

/**
 * GET /api/v1/devices/:id
 * Get device details with latest metrics
 */
router.get(
  '/:id',
  validateParams(deviceIdSchema),
  devicesController.getById.bind(devicesController)
);

/**
 * POST /api/v1/devices
 * Add new UPS device (admin only)
 */
router.post(
  '/',
  // adminAuth, // Uncomment to require admin authentication
  validateBody(createDeviceSchema),
  devicesController.create.bind(devicesController)
);

/**
 * PUT /api/v1/devices/:id
 * Update device configuration (admin only)
 */
router.put(
  '/:id',
  // adminAuth, // Uncomment to require admin authentication
  validateParams(deviceIdSchema),
  validateBody(updateDeviceSchema),
  devicesController.update.bind(devicesController)
);

/**
 * DELETE /api/v1/devices/:id
 * Remove device (admin only)
 */
router.delete(
  '/:id',
  // adminAuth, // Uncomment to require admin authentication
  validateParams(deviceIdSchema),
  devicesController.delete.bind(devicesController)
);

/**
 * POST /api/v1/devices/:id/test
 * Test SNMP connection to device
 */
router.post(
  '/:id/test',
  validateParams(deviceIdSchema),
  devicesController.testConnection.bind(devicesController)
);

export default router;
