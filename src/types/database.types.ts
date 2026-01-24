export interface Device {
  id: number;
  name: string;
  host: string;
  port: number;
  manufacturer?: string;
  model?: string;

  // SNMP Configuration
  snmpVersion: string;
  snmpUsername: string;
  snmpAuthProtocol: string;
  snmpAuthKey: string;
  snmpPrivProtocol: string;
  snmpPrivKey: string;
  snmpSecurityLevel: string;

  // OID Configuration
  oidProfile: string;
  oidOverrides?: Record<string, string>;

  // Polling Configuration
  pollIntervalSeconds: number;
  enabled: boolean;

  // Status Tracking
  lastPollAt?: Date;
  lastPollSuccess?: boolean;
  lastPollError?: string;
  consecutiveFailures: number;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface MetricRaw {
  id: number;
  deviceId: number;
  timestamp: Date;

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
  onBattery: boolean;
  onLine: boolean;
  onBypass: boolean;
  alarmsPresent: boolean;

  // Metadata
  createdAt: Date;
}

export interface MetricAggregated {
  id: number;
  deviceId: number;
  bucketStart: Date;
  bucketDurationSeconds: number;

  // Aggregated Power Metrics
  avgOutputPowerWatts?: number;
  minOutputPowerWatts?: number;
  maxOutputPowerWatts?: number;
  avgOutputPowerVa?: number;
  minOutputPowerVa?: number;
  maxOutputPowerVa?: number;
  avgOutputLoadPercent?: number;
  minOutputLoadPercent?: number;
  maxOutputLoadPercent?: number;

  // Aggregated Battery Metrics
  avgBatteryCapacityPercent?: number;
  minBatteryCapacityPercent?: number;
  maxBatteryCapacityPercent?: number;
  avgBatteryVoltage?: number;
  minBatteryVoltage?: number;
  maxBatteryVoltage?: number;
  avgBatteryTemperature?: number;
  minBatteryTemperature?: number;
  maxBatteryTemperature?: number;
  avgBatteryRuntimeRemainingSeconds?: number;

  // Aggregated Input/Output Metrics
  avgInputVoltage?: number;
  avgOutputVoltage?: number;
  avgInputFrequency?: number;
  avgOutputFrequency?: number;

  // On-Battery Statistics
  onBatterySampleCount: number;
  onBatteryTotalSeconds: number;
  onBatteryEventCount: number;

  // Data Quality
  sampleCount: number;

  // Metadata
  createdAt: Date;
}

export interface BatteryEvent {
  id: number;
  deviceId: number;

  // Event Timing
  eventStart: Date;
  eventEnd?: Date;
  durationSeconds?: number;

  // Battery State
  batteryCapacityStartPercent?: number;
  batteryCapacityEndPercent?: number;
  batteryCapacityDropPercent?: number;

  // Event Details
  triggerReason?: string;
  maxLoadPercent?: number;
  avgLoadPercent?: number;

  // Status
  eventCompleted: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface RetentionPolicy {
  id: number;
  policyName: string;
  tableName: string;
  retentionDays: number;
  enabled: boolean;
  lastCleanupAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type BucketDuration = 3600 | 86400 | 604800 | 2592000; // 1h, 1d, 1w, ~1M
