export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

export class SnmpError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, 'SNMP_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, 'CONFIGURATION_ERROR', details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

export function formatErrorResponse(error: any) {
  if (isAppError(error)) {
    return {
      message: error.message,
      code: error.code,
      details: error.details,
    };
  }

  // Generic error
  return {
    message: error?.message || 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
  };
}
