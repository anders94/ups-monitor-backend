import { config } from './env';

export const snmpDefaults = {
  version: '3',
  timeout: config.snmp.timeout,
  retries: config.snmp.retries,
  port: 161,
};

export const snmpAuthProtocols = {
  MD5: 'MD5',
  SHA: 'SHA',
  'SHA-256': 'SHA256',
} as const;

export const snmpPrivProtocols = {
  DES: 'DES',
  AES: 'AES',
  'AES-256': 'AES256',
} as const;

export const snmpSecurityLevels = {
  noAuthNoPriv: 'noAuthNoPriv',
  authNoPriv: 'authNoPriv',
  authPriv: 'authPriv',
} as const;

// Map database protocol names to net-snmp library names
export function mapAuthProtocol(protocol: string): string {
  return snmpAuthProtocols[protocol as keyof typeof snmpAuthProtocols] || protocol;
}

export function mapPrivProtocol(protocol: string): string {
  return snmpPrivProtocols[protocol as keyof typeof snmpPrivProtocols] || protocol;
}

export default {
  snmpDefaults,
  snmpAuthProtocols,
  snmpPrivProtocols,
  snmpSecurityLevels,
  mapAuthProtocol,
  mapPrivProtocol,
};
