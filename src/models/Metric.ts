import { MetricRaw, MetricAggregated } from '../types/database.types';

export class Metric implements MetricRaw {
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

  constructor(data: MetricRaw) {
    this.id = data.id;
    this.deviceId = data.deviceId;
    this.timestamp = data.timestamp;

    this.outputPowerWatts = data.outputPowerWatts;
    this.outputPowerVa = data.outputPowerVa;
    this.outputLoadPercent = data.outputLoadPercent;

    this.batteryStatus = data.batteryStatus;
    this.batteryCapacityPercent = data.batteryCapacityPercent;
    this.batteryVoltage = data.batteryVoltage;
    this.batteryTemperature = data.batteryTemperature;
    this.batteryRuntimeRemainingSeconds = data.batteryRuntimeRemainingSeconds;

    this.inputVoltage = data.inputVoltage;
    this.inputFrequency = data.inputFrequency;
    this.inputCurrent = data.inputCurrent;

    this.outputVoltage = data.outputVoltage;
    this.outputFrequency = data.outputFrequency;
    this.outputCurrent = data.outputCurrent;

    this.onBattery = data.onBattery;
    this.onLine = data.onLine;
    this.onBypass = data.onBypass;
    this.alarmsPresent = data.alarmsPresent;

    this.createdAt = data.createdAt;
  }
}

export class AggregatedMetric implements MetricAggregated {
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

  constructor(data: MetricAggregated) {
    Object.assign(this, data);
  }
}
