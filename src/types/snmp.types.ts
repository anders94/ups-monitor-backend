export interface SnmpConfig {
  host: string;
  port: number;
  version: string;
  username: string;
  authProtocol: string;
  authKey: string;
  privProtocol: string;
  privKey: string;
  securityLevel: string;
  timeout?: number;
  retries?: number;
}

export interface OidMapping {
  [key: string]: string;
}

export interface OidProfile {
  name: string;
  description: string;
  baseOid: string;
  oids: OidMapping;
  transforms?: {
    [key: string]: (value: any) => any;
  };
}

export interface SnmpValue {
  oid: string;
  type: number;
  value: any;
}

export interface UpsMetrics {
  // Power Metrics
  outputPowerWatts?: number;
  outputPowerVa?: number;
  outputLoadPercent?: number;

  // Battery Metrics
  batteryStatus?: string;
  batteryCapacityPercent?: number;
  batteryVoltage?: number;
  batteryTemperature?: number;
  batteryRuntimeRemainingSeconds?: number;

  // Input Metrics
  inputVoltage?: number;
  inputFrequency?: number;
  inputCurrent?: number;

  // Output Metrics
  outputVoltage?: number;
  outputFrequency?: number;
  outputCurrent?: number;

  // Status Flags
  onBattery?: boolean;
  onLine?: boolean;
  onBypass?: boolean;
  alarmsPresent?: boolean;
}

export type BatteryStatus = 'normal' | 'low' | 'depleted' | 'unknown';
export type SnmpVersion = '1' | '2c' | '3';
export type SnmpAuthProtocol = 'MD5' | 'SHA' | 'SHA-256';
export type SnmpPrivProtocol = 'DES' | 'AES' | 'AES-256';
export type SnmpSecurityLevel = 'noAuthNoPriv' | 'authNoPriv' | 'authPriv';
