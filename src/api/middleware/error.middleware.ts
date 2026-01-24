import { Request, Response, NextFunction } from 'express';
import { isAppError, formatErrorResponse } from '../../utils/errors';
import logger from '../../config/logger';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = (req as any).requestId || 'unknown';

  // Log error
  logger.error('Request error', {
    requestId,
    method: req.method,
    path: req.path,
    error: error.message,
    stack: error.stack,
  });

  // Determine status code
  const statusCode = isAppError(error) ? error.statusCode : 500;

  // Format error response
  const errorResponse = formatErrorResponse(error);

  // Send response
  res.status(statusCode).json({
    success: false,
    error: errorResponse,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  const requestId = (req as any).requestId || 'unknown';

  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: 'NOT_FOUND',
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  });
}
