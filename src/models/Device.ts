import { Device as DeviceType } from '../types/database.types';

export class Device implements DeviceType {
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

  constructor(data: DeviceType) {
    this.id = data.id;
    this.name = data.name;
    this.host = data.host;
    this.port = data.port;
    this.manufacturer = data.manufacturer;
    this.model = data.model;

    this.snmpVersion = data.snmpVersion;
    this.snmpUsername = data.snmpUsername;
    this.snmpAuthProtocol = data.snmpAuthProtocol;
    this.snmpAuthKey = data.snmpAuthKey;
    this.snmpPrivProtocol = data.snmpPrivProtocol;
    this.snmpPrivKey = data.snmpPrivKey;
    this.snmpSecurityLevel = data.snmpSecurityLevel;

    this.oidProfile = data.oidProfile;
    this.oidOverrides = data.oidOverrides;

    this.pollIntervalSeconds = data.pollIntervalSeconds;
    this.enabled = data.enabled;

    this.lastPollAt = data.lastPollAt;
    this.lastPollSuccess = data.lastPollSuccess;
    this.lastPollError = data.lastPollError;
    this.consecutiveFailures = data.consecutiveFailures;

    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  isHealthy(): boolean {
    return this.enabled && this.consecutiveFailures < 3;
  }

  toJSON() {
    // Exclude sensitive credentials from JSON output
    const { snmpAuthKey, snmpPrivKey, ...safe } = this;
    return {
      ...safe,
      snmpAuthKey: snmpAuthKey ? '[REDACTED]' : undefined,
      snmpPrivKey: snmpPrivKey ? '[REDACTED]' : undefined,
    };
  }
}
