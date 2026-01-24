import snmp from 'net-snmp';
import { UpsMetrics, SnmpValue } from '../types/snmp.types';
import { Device } from '../types/database.types';
import { getOidProfile } from '../collectors/oid-profiles';
import { SnmpError } from '../utils/errors';
import { parseSnmpInt, parseSnmpFloat } from '../utils/transformers';
import { mapAuthProtocol, mapPrivProtocol } from '../config/snmp';
import logger from '../config/logger';

export class SnmpService {
  /**
   * Create SNMP session for a device
   */
  private createSession(device: Device): snmp.Session {
    const options: any = {
      version: snmp.Version3,
      timeout: device.pollIntervalSeconds ? device.pollIntervalSeconds * 500 : 5000,
      retries: 1,
    };

    // SNMPv3 User
    const user: any = {
      name: device.snmpUsername,
      level: this.mapSecurityLevel(device.snmpSecurityLevel),
      authProtocol: this.mapAuthProtocol(device.snmpAuthProtocol),
      authKey: device.snmpAuthKey,
      privProtocol: this.mapPrivProtocol(device.snmpPrivProtocol),
      privKey: device.snmpPrivKey,
    };

    options.user = user;

    const session = snmp.createV3Session(device.host, user, options);

    return session;
  }

  /**
   * Map database security level to net-snmp constant
   */
  private mapSecurityLevel(level: string): snmp.SecurityLevel {
    switch (level) {
      case 'noAuthNoPriv':
        return snmp.SecurityLevel.noAuthNoPriv;
      case 'authNoPriv':
        return snmp.SecurityLevel.authNoPriv;
      case 'authPriv':
        return snmp.SecurityLevel.authPriv;
      default:
        return snmp.SecurityLevel.authPriv;
    }
  }

  /**
   * Map database auth protocol to net-snmp constant
   */
  private mapAuthProtocol(protocol: string): snmp.AuthProtocols {
    const mapped = mapAuthProtocol(protocol);
    switch (mapped) {
      case 'MD5':
        return snmp.AuthProtocols.md5;
      case 'SHA':
        return snmp.AuthProtocols.sha;
      case 'SHA256':
        return snmp.AuthProtocols.sha256 || snmp.AuthProtocols.sha; // Fallback if SHA256 not available
      default:
        return snmp.AuthProtocols.sha;
    }
  }

  /**
   * Map database priv protocol to net-snmp constant
   */
  private mapPrivProtocol(protocol: string): snmp.PrivProtocols {
    const mapped = mapPrivProtocol(protocol);
    switch (mapped) {
      case 'DES':
        return snmp.PrivProtocols.des;
      case 'AES':
        return snmp.PrivProtocols.aes;
      case 'AES256':
        return snmp.PrivProtocols.aes256b || snmp.PrivProtocols.aes; // Fallback if AES256 not available
      default:
        return snmp.PrivProtocols.aes;
    }
  }

  /**
   * Poll metrics from UPS device
   */
  async pollDevice(device: Device): Promise<UpsMetrics> {
    const session = this.createSession(device);

    try {
      // Get OID profile
      const profile = getOidProfile(device.oidProfile);
      if (!profile) {
        throw new SnmpError(`OID profile '${device.oidProfile}' not found`);
      }

      // Merge profile OIDs with device-specific overrides
      const oids = { ...profile.oids, ...device.oidOverrides };

      // Get all OIDs to query
      const oidList = Object.values(oids);

      // Perform SNMP GET
      const varbinds = await this.snmpGet(session, oidList);

      // Parse results into metrics
      const metrics = this.parseMetrics(varbinds, oids, profile.transforms || {});

      logger.debug('SNMP poll successful', {
        deviceId: device.id,
        deviceName: device.name,
        metricsCount: Object.keys(metrics).length,
      });

      return metrics;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('SNMP poll failed', {
        deviceId: device.id,
        deviceName: device.name,
        host: device.host,
        error: errorMsg,
      });
      throw new SnmpError(`SNMP poll failed for device ${device.name}: ${errorMsg}`, {
        deviceId: device.id,
        host: device.host,
      });
    } finally {
      session.close();
    }
  }

  /**
   * Perform SNMP GET request
   */
  private async snmpGet(session: snmp.Session, oids: string[]): Promise<SnmpValue[]> {
    return new Promise((resolve, reject) => {
      session.get(oids, (error: Error | null, varbinds?: any[]) => {
        if (error) {
          reject(error);
        } else if (!varbinds) {
          reject(new Error('No varbinds returned'));
        } else {
          const results: SnmpValue[] = varbinds.map((vb: any) => ({
            oid: vb.oid,
            type: vb.type,
            value: vb.value,
          }));
          resolve(results);
        }
      });
    });
  }

  /**
   * Parse SNMP varbinds into UpsMetrics
   */
  private parseMetrics(
    varbinds: SnmpValue[],
    oidMapping: Record<string, string>,
    transforms: Record<string, (value: any) => any>
  ): UpsMetrics {
    const metrics: UpsMetrics = {};

    // Create reverse mapping (OID -> key)
    const reverseMapping: Record<string, string> = {};
    for (const [key, oid] of Object.entries(oidMapping)) {
      reverseMapping[oid] = key;
    }

    // Special handling for outputSource (used to derive status flags)
    let outputSource: number | undefined;

    for (const vb of varbinds) {
      const key = reverseMapping[vb.oid];
      if (!key) continue;

      let value = vb.value;

      // Apply transform if exists
      if (transforms[key]) {
        value = transforms[key](value);
      } else {
        // Default parsing
        if (typeof value === 'number') {
          value = value;
        } else if (Buffer.isBuffer(value)) {
          value = value.toString();
        }
      }

      // Store outputSource for later processing
      if (key === 'outputSource') {
        outputSource = parseSnmpInt(vb.value);
      }

      // Map to UpsMetrics
      switch (key) {
        case 'outputPower':
          metrics.outputPowerWatts = parseSnmpFloat(value);
          break;
        case 'outputApparentPower':
          metrics.outputPowerVa = parseSnmpFloat(value);
          break;
        case 'outputLoad':
          metrics.outputLoadPercent = parseSnmpFloat(value);
          break;
        case 'batteryStatus':
          metrics.batteryStatus = String(value);
          break;
        case 'batteryCapacityPercent':
          metrics.batteryCapacityPercent = parseSnmpFloat(value);
          break;
        case 'batteryVoltage':
          metrics.batteryVoltage = parseSnmpFloat(value);
          break;
        case 'batteryTemperature':
          metrics.batteryTemperature = parseSnmpFloat(value);
          break;
        case 'batteryRunTimeRemaining':
        case 'batteryMinutesRemaining':
          metrics.batteryRuntimeRemainingSeconds = parseSnmpInt(value);
          break;
        case 'inputVoltage':
          metrics.inputVoltage = parseSnmpFloat(value);
          break;
        case 'inputFrequency':
          metrics.inputFrequency = parseSnmpFloat(value);
          break;
        case 'inputCurrent':
          metrics.inputCurrent = parseSnmpFloat(value);
          break;
        case 'outputVoltage':
          metrics.outputVoltage = parseSnmpFloat(value);
          break;
        case 'outputFrequency':
          metrics.outputFrequency = parseSnmpFloat(value);
          break;
        case 'outputCurrent':
          metrics.outputCurrent = parseSnmpFloat(value);
          break;
        case 'alarmsPresent':
          metrics.alarmsPresent = Boolean(value);
          break;
      }
    }

    // Derive status flags from outputSource if not already set
    if (outputSource !== undefined) {
      if (metrics.onBattery === undefined) {
        metrics.onBattery = outputSource === 5;
      }
      if (metrics.onLine === undefined) {
        metrics.onLine = outputSource === 3;
      }
      if (metrics.onBypass === undefined) {
        metrics.onBypass = outputSource === 4;
      }
    }

    // Set defaults if still undefined
    if (metrics.onBattery === undefined) metrics.onBattery = false;
    if (metrics.onLine === undefined) metrics.onLine = true;
    if (metrics.onBypass === undefined) metrics.onBypass = false;
    if (metrics.alarmsPresent === undefined) metrics.alarmsPresent = false;

    return metrics;
  }

  /**
   * Test SNMP connection to device
   */
  async testConnection(device: Device): Promise<boolean> {
    try {
      await this.pollDevice(device);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new SnmpService();
