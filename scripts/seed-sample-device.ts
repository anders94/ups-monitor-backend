import dotenv from 'dotenv';
dotenv.config();

import db from '../src/config/database';
import logger from '../src/config/logger';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function seedDevice() {
  try {
    console.log('===========================================');
    console.log('UPS Monitor - Add Sample Device');
    console.log('===========================================\n');

    // Test database connection
    const connected = await db.testConnection();
    if (!connected) {
      console.error('Failed to connect to database. Please check your .env configuration.');
      process.exit(1);
    }

    console.log('Enter device details:\n');

    const name = await question('Device name (e.g., "Main Office UPS"): ');
    const host = await question('Host/IP address (e.g., "192.168.1.100"): ');
    const port = await question('SNMP port [161]: ') || '161';
    const manufacturer = await question('Manufacturer (e.g., "APC") [optional]: ');
    const model = await question('Model (e.g., "SMTL1000RM2UCNC") [optional]: ');

    console.log('\nSNMPv3 Configuration:');
    const snmpUsername = await question('SNMP username: ');
    const snmpAuthProtocol = await question('Auth protocol (MD5/SHA/SHA-256) [SHA]: ') || 'SHA';
    const snmpAuthKey = await question('Auth key (min 8 chars): ');
    const snmpPrivProtocol = await question('Privacy protocol (DES/AES/AES-256) [AES]: ') || 'AES';
    const snmpPrivKey = await question('Privacy key (min 8 chars): ');

    console.log('\nOID Profile:');
    const oidProfile = await question('OID profile (apc-powernet/rfc1628) [apc-powernet]: ') || 'apc-powernet';

    const pollInterval = await question('\nPoll interval in seconds [60]: ') || '60';

    console.log('\n-------------------------------------------');
    console.log('Device Summary:');
    console.log(`  Name: ${name}`);
    console.log(`  Host: ${host}:${port}`);
    console.log(`  Manufacturer: ${manufacturer || 'Not specified'}`);
    console.log(`  Model: ${model || 'Not specified'}`);
    console.log(`  SNMP Username: ${snmpUsername}`);
    console.log(`  Auth Protocol: ${snmpAuthProtocol}`);
    console.log(`  Priv Protocol: ${snmpPrivProtocol}`);
    console.log(`  OID Profile: ${oidProfile}`);
    console.log(`  Poll Interval: ${pollInterval}s`);
    console.log('-------------------------------------------\n');

    const confirm = await question('Create this device? (yes/no): ');
    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('Cancelled.');
      process.exit(0);
    }

    // Insert device
    const result = await db.query(`
      INSERT INTO devices (
        name, host, port, manufacturer, model,
        snmp_version, snmp_username, snmp_auth_protocol, snmp_auth_key,
        snmp_priv_protocol, snmp_priv_key, snmp_security_level,
        oid_profile, poll_interval_seconds, enabled
      ) VALUES (
        $1, $2, $3, $4, $5, '3', $6, $7, $8, $9, $10, 'authPriv', $11, $12, true
      ) RETURNING id
    `, [
      name,
      host,
      parseInt(port, 10),
      manufacturer || null,
      model || null,
      snmpUsername,
      snmpAuthProtocol,
      snmpAuthKey,
      snmpPrivProtocol,
      snmpPrivKey,
      oidProfile,
      parseInt(pollInterval, 10),
    ]);

    const deviceId = result.rows[0].id;

    console.log('\n✓ Device created successfully!');
    console.log(`  Device ID: ${deviceId}`);
    console.log('\nNext steps:');
    console.log('  1. Start the application: npm run dev');
    console.log('  2. Test connection: curl http://localhost:3000/api/v1/devices');
    console.log(`  3. View device: curl http://localhost:3000/api/v1/devices/${deviceId}`);
    console.log('\n');
  } catch (error) {
    console.error('Error creating device:', error);
    logger.error('Seed device failed', { error });
  } finally {
    rl.close();
    await db.close();
    process.exit(0);
  }
}

seedDevice();
