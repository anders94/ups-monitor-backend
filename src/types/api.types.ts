import { Request } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface TimeRangeParams {
  start?: string; // ISO timestamp
  end?: string; // ISO timestamp
}

export interface MetricsQueryParams extends TimeRangeParams {
  interval?: number; // seconds (60, 3600, 86400, etc.)
  deviceIds?: number[];
}

export interface BatteryEventsQueryParams extends TimeRangeParams, PaginationParams {
  deviceIds?: number[];
}

export interface DeviceCreateInput {
  name: string;
  host: string;
  port?: number;
  manufacturer?: string;
  model?: string;

  // SNMP Configuration
  snmpUsername: string;
  snmpAuthProtocol: string;
  snmpAuthKey: string;
  snmpPrivProtocol: string;
  snmpPrivKey: string;
  snmpSecurityLevel?: string;

  // OID Configuration
  oidProfile?: string;
  oidOverrides?: Record<string, string>;

  // Polling Configuration
  pollIntervalSeconds?: number;
  enabled?: boolean;
}

export interface DeviceUpdateInput {
  name?: string;
  host?: string;
  port?: number;
  manufacturer?: string;
  model?: string;

  // SNMP Configuration
  snmpUsername?: string;
  snmpAuthProtocol?: string;
  snmpAuthKey?: string;
  snmpPrivProtocol?: string;
  snmpPrivKey?: string;
  snmpSecurityLevel?: string;

  // OID Configuration
  oidProfile?: string;
  oidOverrides?: Record<string, string>;

  // Polling Configuration
  pollIntervalSeconds?: number;
  enabled?: boolean;
}

export interface AuthenticatedRequest extends Request {
  apiKey?: string;
  requestId?: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  database: {
    connected: boolean;
    responseTimeMs?: number;
  };
  collector: {
    lastPollAt?: Date;
    activeDevices: number;
    failedDevices: number;
  };
  uptime: number;
}

export interface DeviceSummary {
  id: number;
  name: string;
  host: string;
  enabled: boolean;
  lastPollAt?: Date;
  lastPollSuccess?: boolean;
  latestMetrics?: {
    timestamp?: Date;
    outputPowerWatts?: number;
    outputLoadPercent?: number;
    batteryCapacityPercent?: number;
    batteryStatus?: string;
    onBattery?: boolean;
    onLine?: boolean;
  };
}

export interface SystemStats {
  devices: {
    total: number;
    enabled: number;
    disabled: number;
    healthy: number;
    failing: number;
  };
  metrics: {
    rawCount: number;
    aggregatedCount: number;
    oldestRaw?: Date;
    newestRaw?: Date;
  };
  database: {
    sizeBytes?: number;
    sizeMb?: number;
  };
  deviceSummaries: DeviceSummary[];
}
