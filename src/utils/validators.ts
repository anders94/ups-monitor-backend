import { ValidationError } from './errors';

export function validatePositiveInteger(value: any, fieldName: string): number {
  const num = parseInt(value, 10);
  if (isNaN(num) || num <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer`);
  }
  return num;
}

export function validateTimestamp(value: any, fieldName: string): Date {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid ISO timestamp`);
  }
  return date;
}

export function validateTimeRange(start?: string, end?: string) {
  if (!start && !end) {
    return { start: undefined, end: undefined };
  }

  const startDate = start ? validateTimestamp(start, 'start') : undefined;
  const endDate = end ? validateTimestamp(end, 'end') : undefined;

  if (startDate && endDate && startDate >= endDate) {
    throw new ValidationError('start must be before end');
  }

  return { start: startDate, end: endDate };
}

export function validateBucketDuration(interval?: number): number | undefined {
  if (!interval) return undefined;

  const validIntervals = [60, 3600, 86400, 604800, 2592000];
  if (!validIntervals.includes(interval)) {
    throw new ValidationError(
      `interval must be one of: ${validIntervals.join(', ')} (1m, 1h, 1d, 1w, 1M)`
    );
  }

  return interval;
}

export function validateDeviceIds(deviceIds?: any): number[] | undefined {
  if (!deviceIds) return undefined;

  const ids = Array.isArray(deviceIds) ? deviceIds : [deviceIds];
  return ids.map((id, index) => validatePositiveInteger(id, `deviceIds[${index}]`));
}

export function validatePagination(page?: any, limit?: any) {
  const pageNum = page ? validatePositiveInteger(page, 'page') : 1;
  const limitNum = limit ? validatePositiveInteger(limit, 'limit') : 100;

  if (limitNum > 1000) {
    throw new ValidationError('limit cannot exceed 1000');
  }

  return {
    page: pageNum,
    limit: limitNum,
    offset: (pageNum - 1) * limitNum,
  };
}

export function validateSnmpCredentials(
  username: string,
  authProtocol: string,
  authKey: string,
  privProtocol: string,
  privKey: string,
  securityLevel: string
) {
  if (!username) {
    throw new ValidationError('snmpUsername is required');
  }

  const validAuthProtocols = ['MD5', 'SHA', 'SHA-256'];
  if (!validAuthProtocols.includes(authProtocol)) {
    throw new ValidationError(
      `snmpAuthProtocol must be one of: ${validAuthProtocols.join(', ')}`
    );
  }

  const validPrivProtocols = ['DES', 'AES', 'AES-256'];
  if (!validPrivProtocols.includes(privProtocol)) {
    throw new ValidationError(
      `snmpPrivProtocol must be one of: ${validPrivProtocols.join(', ')}`
    );
  }

  const validSecurityLevels = ['noAuthNoPriv', 'authNoPriv', 'authPriv'];
  if (!validSecurityLevels.includes(securityLevel)) {
    throw new ValidationError(
      `snmpSecurityLevel must be one of: ${validSecurityLevels.join(', ')}`
    );
  }

  if (securityLevel === 'authPriv' || securityLevel === 'authNoPriv') {
    if (!authKey || authKey.length < 8) {
      throw new ValidationError('snmpAuthKey must be at least 8 characters for authenticated access');
    }
  }

  if (securityLevel === 'authPriv') {
    if (!privKey || privKey.length < 8) {
      throw new ValidationError('snmpPrivKey must be at least 8 characters for encrypted access');
    }
  }
}

export function sanitizeString(value: any): string | undefined {
  if (value === null || value === undefined) return undefined;
  return String(value).trim();
}

export function sanitizeBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return Boolean(value);
}
