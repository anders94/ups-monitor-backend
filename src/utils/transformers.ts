import { UpsMetrics } from '../types/snmp.types';
import { MetricRaw } from '../types/database.types';

/**
 * Transform UPS metrics to database row format
 */
export function transformMetricsToDbRow(deviceId: number, metrics: UpsMetrics): Partial<MetricRaw> {
  return {
    deviceId,
    outputPowerWatts: metrics.outputPowerWatts,
    outputPowerVa: metrics.outputPowerVa,
    outputLoadPercent: metrics.outputLoadPercent,
    batteryStatus: metrics.batteryStatus,
    batteryCapacityPercent: metrics.batteryCapacityPercent,
    batteryVoltage: metrics.batteryVoltage,
    batteryTemperature: metrics.batteryTemperature,
    batteryRuntimeRemainingSeconds: metrics.batteryRuntimeRemainingSeconds,
    inputVoltage: metrics.inputVoltage,
    inputFrequency: metrics.inputFrequency,
    inputCurrent: metrics.inputCurrent,
    outputVoltage: metrics.outputVoltage,
    outputFrequency: metrics.outputFrequency,
    outputCurrent: metrics.outputCurrent,
    onBattery: metrics.onBattery ?? false,
    onLine: metrics.onLine ?? true,
    onBypass: metrics.onBypass ?? false,
    alarmsPresent: metrics.alarmsPresent ?? false,
  };
}

/**
 * Convert database snake_case to camelCase
 */
export function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);

  return Object.keys(obj).reduce((acc: any, key: string) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    acc[camelKey] = toCamelCase(obj[key]);
    return acc;
  }, {});
}

/**
 * Convert camelCase to database snake_case
 */
export function toSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);

  return Object.keys(obj).reduce((acc: any, key: string) => {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    acc[snakeKey] = toSnakeCase(obj[key]);
    return acc;
  }, {});
}

/**
 * Auto-select appropriate bucket duration based on time range
 */
export function autoSelectBucketDuration(start: Date, end: Date): number {
  const durationMs = end.getTime() - start.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);

  // < 6 hours: use raw data (60 seconds)
  if (durationHours < 6) return 60;

  // < 7 days: use hourly (3600 seconds)
  if (durationHours < 168) return 3600;

  // < 90 days: use daily (86400 seconds)
  if (durationHours < 2160) return 86400;

  // >= 90 days: use weekly (604800 seconds)
  return 604800;
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

/**
 * Round number to specified decimal places
 */
export function roundTo(value: number | undefined, decimals: number = 2): number | undefined {
  if (value === undefined || value === null) return undefined;
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Convert centiseconds to seconds (APC specific)
 */
export function centisecondsToSeconds(centiseconds: number): number {
  return Math.round(centiseconds / 100);
}

/**
 * Convert tenths to whole number (APC specific)
 */
export function tenthsToWhole(tenths: number): number {
  return roundTo(tenths / 10, 1)!;
}

/**
 * Parse SNMP integer value
 */
export function parseSnmpInt(value: any): number | undefined {
  if (value === null || value === undefined) return undefined;
  const num = parseInt(value, 10);
  return isNaN(num) ? undefined : num;
}

/**
 * Parse SNMP float value
 */
export function parseSnmpFloat(value: any): number | undefined {
  if (value === null || value === undefined) return undefined;
  const num = parseFloat(value);
  return isNaN(num) ? undefined : num;
}

/**
 * Parse battery status enum (APC specific)
 */
export function parseBatteryStatus(status: number): string {
  switch (status) {
    case 1: return 'unknown';
    case 2: return 'normal';
    case 3: return 'low';
    case 4: return 'depleted';
    default: return 'unknown';
  }
}

/**
 * Parse boolean from SNMP integer (1=true, 2=false, etc.)
 */
export function parseSnmpBoolean(value: number): boolean {
  return value === 1;
}
