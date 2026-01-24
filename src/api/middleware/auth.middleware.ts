import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '../../utils/errors';
import { config } from '../../config/env';

/**
 * API Key authentication middleware (optional - commented out by default)
 *
 * Enable this middleware by:
 * 1. Setting API_KEY in .env
 * 2. Uncommenting the middleware in routes where needed
 * 3. Passing API key in header: X-API-Key: <your-key>
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  // Skip if no API key configured (internal-only deployment)
  if (!config.app.apiKey) {
    next();
    return;
  }

  const apiKey = req.header('X-API-Key');

  if (!apiKey) {
    throw new AuthenticationError('API key required');
  }

  if (apiKey !== config.app.apiKey) {
    throw new AuthenticationError('Invalid API key');
  }

  next();
}

/**
 * Optional admin-level authentication
 * Can be extended with user roles, JWT, etc.
 */
export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  // For now, uses same API key
  // In production, implement proper role-based access control
  apiKeyAuth(req, res, next);
}
