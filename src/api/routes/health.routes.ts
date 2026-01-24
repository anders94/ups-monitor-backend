import { Router } from 'express';
import healthController from '../controllers/health.controller';

const router = Router();

/**
 * GET /api/v1/health
 * Health check endpoint
 */
router.get('/health', healthController.getHealth.bind(healthController));

/**
 * GET /api/v1/stats
 * System statistics
 */
router.get('/stats', healthController.getStats.bind(healthController));

export default router;
