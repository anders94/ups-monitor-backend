import { OidProfile } from '../../types/snmp.types';
import {
  tenthsToWhole,
  parseBatteryStatus,
} from '../../utils/transformers';

/**
 * RFC 1628 UPS-MIB OID Profile
 * Standard UPS Management Information Base
 * Compatible with most SNMP-enabled UPS devices
 * Base OID: 1.3.6.1.2.1.33
 */
export const rfc1628Profile: OidProfile = {
  name: 'rfc1628',
  description: 'RFC 1628 Standard UPS-MIB',
  baseOid: '1.3.6.1.2.1.33',
  oids: {
    // Battery Group (1.3.6.1.2.1.33.1.2.*)
    batteryStatus: '1.3.6.1.2.1.33.1.2.1.0', // 1=unknown, 2=normal, 3=low, 4=depleted
    batterySecondsOnBattery: '1.3.6.1.2.1.33.1.2.2.0', // Seconds
    batteryMinutesRemaining: '1.3.6.1.2.1.33.1.2.3.0', // Minutes
    batteryCapacityPercent: '1.3.6.1.2.1.33.1.2.4.0', // Percentage
    batteryVoltage: '1.3.6.1.2.1.33.1.2.5.0', // Tenths of volts
    batteryTemperature: '1.3.6.1.2.1.33.1.2.7.0', // Celsius

    // Input Group (1.3.6.1.2.1.33.1.3.*)
    inputLineBads: '1.3.6.1.2.1.33.1.3.1.0', // Count
    inputNumLines: '1.3.6.1.2.1.33.1.3.2.0', // Number of input lines
    inputFrequency: '1.3.6.1.2.1.33.1.3.3.1.2.1', // Tenths of Hz
    inputVoltage: '1.3.6.1.2.1.33.1.3.3.1.3.1', // Volts
    inputCurrent: '1.3.6.1.2.1.33.1.3.3.1.4.1', // Tenths of amps
    inputTruePower: '1.3.6.1.2.1.33.1.3.3.1.5.1', // Watts

    // Output Group (1.3.6.1.2.1.33.1.4.*)
    outputSource: '1.3.6.1.2.1.33.1.4.1.0', // 1=other, 2=none, 3=normal, 4=bypass, 5=battery, 6=booster, 7=reducer
    outputFrequency: '1.3.6.1.2.1.33.1.4.2.0', // Tenths of Hz
    outputNumLines: '1.3.6.1.2.1.33.1.4.3.0', // Number of output lines
    outputVoltage: '1.3.6.1.2.1.33.1.4.4.1.2.1', // Volts
    outputCurrent: '1.3.6.1.2.1.33.1.4.4.1.3.1', // Tenths of amps
    outputPower: '1.3.6.1.2.1.33.1.4.4.1.4.1', // Watts
    outputLoad: '1.3.6.1.2.1.33.1.4.4.1.5.1', // Percentage

    // Bypass Group (1.3.6.1.2.1.33.1.5.*)
    bypassFrequency: '1.3.6.1.2.1.33.1.5.1.0', // Tenths of Hz
    bypassNumLines: '1.3.6.1.2.1.33.1.5.2.0',

    // Alarms Group (1.3.6.1.2.1.33.1.6.*)
    alarmsPresent: '1.3.6.1.2.1.33.1.6.1.0', // Number of active alarms
  },
  transforms: {
    batteryStatus: parseBatteryStatus,
    batteryMinutesRemaining: (minutes: number) => minutes * 60, // Convert to seconds
    batteryVoltage: tenthsToWhole,
    inputFrequency: tenthsToWhole,
    inputCurrent: tenthsToWhole,
    outputFrequency: tenthsToWhole,
    outputCurrent: tenthsToWhole,
    onBattery: (outputSource: number) => outputSource === 5, // 5 = battery
    onLine: (outputSource: number) => outputSource === 3, // 3 = normal
    onBypass: (outputSource: number) => outputSource === 4, // 4 = bypass
    alarmsPresent: (count: number) => count > 0,
  },
};

export default rfc1628Profile;
