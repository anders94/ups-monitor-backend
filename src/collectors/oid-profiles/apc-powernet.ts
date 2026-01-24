import { OidProfile } from '../../types/snmp.types';
import {
  centisecondsToSeconds,
  tenthsToWhole,
  parseBatteryStatus,
} from '../../utils/transformers';

/**
 * APC PowerNet MIB OID Profile
 * Optimized for APC Smart-UPS models (e.g., SMTL1000RM2UCNC)
 * Base OID: 1.3.6.1.4.1.318
 */
export const apcPowernetProfile: OidProfile = {
  name: 'apc-powernet',
  description: 'APC PowerNet MIB for Smart-UPS devices',
  baseOid: '1.3.6.1.4.1.318.1.1.1',
  oids: {
    // Battery Information (1.3.6.1.4.1.318.1.1.1.2.*)
    batteryStatus: '1.3.6.1.4.1.318.1.1.1.2.1.1.0', // 1=unknown, 2=normal, 3=low, 4=depleted
    batteryCapacityPercent: '1.3.6.1.4.1.318.1.1.1.2.2.1.0', // Remaining capacity %
    batteryTemperature: '1.3.6.1.4.1.318.1.1.1.2.2.2.0', // Celsius
    batteryRunTimeRemaining: '1.3.6.1.4.1.318.1.1.1.2.2.3.0', // Centiseconds (÷100 for seconds)
    batteryVoltage: '1.3.6.1.4.1.318.1.1.1.2.2.8.0', // Volts

    // Input Information (1.3.6.1.4.1.318.1.1.1.3.*)
    inputVoltage: '1.3.6.1.4.1.318.1.1.1.3.2.1.0', // Volts
    inputFrequency: '1.3.6.1.4.1.318.1.1.1.3.2.4.0', // Hertz
    inputLineBads: '1.3.6.1.4.1.318.1.1.1.3.1.1.0', // Count of bad input events

    // Output Information (1.3.6.1.4.1.318.1.1.1.4.*)
    outputVoltage: '1.3.6.1.4.1.318.1.1.1.4.2.1.0', // Volts
    outputFrequency: '1.3.6.1.4.1.318.1.1.1.4.2.2.0', // Hertz
    outputLoad: '1.3.6.1.4.1.318.1.1.1.4.2.3.0', // Percentage
    outputCurrent: '1.3.6.1.4.1.318.1.1.1.4.2.4.0', // Amps (tenths)
    outputPower: '1.3.6.1.4.1.318.1.1.1.4.2.8.0', // Watts
    outputApparentPower: '1.3.6.1.4.1.318.1.1.1.4.2.9.0', // VA

    // UPS Status (1.3.6.1.4.1.318.1.1.1.4.1.*)
    outputSource: '1.3.6.1.4.1.318.1.1.1.4.1.1.0', // 1=other, 2=none, 3=normal, 4=bypass, 5=battery, 6=booster, 7=reducer

    // Advanced Status (1.3.6.1.4.1.318.1.1.1.11.*)
    alarmsPresent: '1.3.6.1.4.1.318.1.1.1.11.1.1.0', // Number of active alarms
  },
  transforms: {
    batteryStatus: parseBatteryStatus,
    batteryRunTimeRemaining: centisecondsToSeconds,
    outputCurrent: tenthsToWhole,
    onBattery: (outputSource: number) => outputSource === 5, // 5 = battery
    onLine: (outputSource: number) => outputSource === 3, // 3 = normal
    onBypass: (outputSource: number) => outputSource === 4, // 4 = bypass
    alarmsPresent: (count: number) => count > 0,
  },
};

export default apcPowernetProfile;
