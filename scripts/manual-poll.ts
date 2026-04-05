import dotenv from 'dotenv';
dotenv.config();

import db from '../src/config/database';
import snmpService from '../src/services/snmp.service';
import logger from '../src/config/logger';
import deviceRepository from '../src/repositories/device.repository';

async function manualPoll() {
  try {
    console.log('===========================================');
    console.log('UPS Monitor - Manual SNMP Poll Test');
    console.log('===========================================\n');

    // Test database connection
    const connected = await db.testConnection();
    if (!connected) {
      console.error('Failed to connect to database. Please check your .env configuration.');
      process.exit(1);
    }

    // Get all enabled devices
    const devices = await deviceRepository.findEnabledDevices();

    if (devices.length === 0) {
      console.log('No enabled devices found. Please add a device first:');
      console.log('  npm run seed\n');
      process.exit(0);
    }

    console.log(`Found ${devices.length} enabled device(s):\n`);

    for (const device of devices) {
      console.log(`-------------------------------------------`);
      console.log(`Device: ${device.name} (ID: ${device.id})`);
      console.log(`Host: ${device.host}:${device.port}`);
      console.log(`OID Profile: ${device.oidProfile}`);
      console.log(`-------------------------------------------`);

      try {
        console.log('Polling device...');
        const startTime = Date.now();
        const metrics = await snmpService.pollDevice(device);
        const duration = Date.now() - startTime;

        console.log(`✓ Poll successful (${duration}ms)\n`);
        console.log('Metrics:');
        console.log(`  Power Output: ${metrics.outputPowerWatts ?? 'N/A'} W`);
        console.log(`  Power (VA): ${metrics.outputPowerVa ?? 'N/A'} VA`);
        console.log(`  Load: ${metrics.outputLoadPercent ?? 'N/A'}%`);
        console.log(`  Battery Status: ${metrics.batteryStatus ?? 'N/A'}`);
        console.log(`  Battery Capacity: ${metrics.batteryCapacityPercent ?? 'N/A'}%`);
        console.log(`  Battery Voltage: ${metrics.batteryVoltage ?? 'N/A'} V`);
        console.log(`  Battery Temperature: ${metrics.batteryTemperature ?? 'N/A'} °C`);
        console.log(`  Runtime Remaining: ${metrics.batteryRuntimeRemainingSeconds != null ? Math.floor(metrics.batteryRuntimeRemainingSeconds / 60) : 'N/A'} min`);
        console.log(`  Input Voltage: ${metrics.inputVoltage ?? 'N/A'} V`);
        console.log(`  Output Voltage: ${metrics.outputVoltage ?? 'N/A'} V`);
        console.log(`  On Battery: ${metrics.onBattery ? 'YES' : 'NO'}`);
        console.log(`  On Line: ${metrics.onLine ? 'YES' : 'NO'}`);
        console.log(`  Alarms Present: ${metrics.alarmsPresent ? 'YES' : 'NO'}`);
        console.log('');
      } catch (error) {
        console.error(`✗ Poll failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      }
    }

    console.log('===========================================\n');
  } catch (error) {
    console.error('Error:', error);
    logger.error('Manual poll failed', { error });
  } finally {
    await db.close();
    process.exit(0);
  }
}

manualPoll();
