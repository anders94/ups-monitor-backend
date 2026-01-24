import Joi from 'joi';

export const deviceIdSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const createDeviceSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  host: Joi.string().hostname().required(),
  port: Joi.number().integer().min(1).max(65535).default(161),
  manufacturer: Joi.string().max(100).optional(),
  model: Joi.string().max(100).optional(),

  // SNMP Configuration
  snmpUsername: Joi.string().min(1).max(100).required(),
  snmpAuthProtocol: Joi.string().valid('MD5', 'SHA', 'SHA-256').required(),
  snmpAuthKey: Joi.string().min(8).max(255).required(),
  snmpPrivProtocol: Joi.string().valid('DES', 'AES', 'AES-256').required(),
  snmpPrivKey: Joi.string().min(8).max(255).required(),
  snmpSecurityLevel: Joi.string().valid('noAuthNoPriv', 'authNoPriv', 'authPriv').default('authPriv'),

  // OID Configuration
  oidProfile: Joi.string().valid('apc-powernet', 'rfc1628').default('apc-powernet'),
  oidOverrides: Joi.object().pattern(Joi.string(), Joi.string()).optional(),

  // Polling Configuration
  pollIntervalSeconds: Joi.number().integer().min(30).max(3600).default(60),
  enabled: Joi.boolean().default(true),
});

export const updateDeviceSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  host: Joi.string().hostname().optional(),
  port: Joi.number().integer().min(1).max(65535).optional(),
  manufacturer: Joi.string().max(100).optional().allow(null),
  model: Joi.string().max(100).optional().allow(null),

  // SNMP Configuration
  snmpUsername: Joi.string().min(1).max(100).optional(),
  snmpAuthProtocol: Joi.string().valid('MD5', 'SHA', 'SHA-256').optional(),
  snmpAuthKey: Joi.string().min(8).max(255).optional(),
  snmpPrivProtocol: Joi.string().valid('DES', 'AES', 'AES-256').optional(),
  snmpPrivKey: Joi.string().min(8).max(255).optional(),
  snmpSecurityLevel: Joi.string().valid('noAuthNoPriv', 'authNoPriv', 'authPriv').optional(),

  // OID Configuration
  oidProfile: Joi.string().valid('apc-powernet', 'rfc1628').optional(),
  oidOverrides: Joi.object().pattern(Joi.string(), Joi.string()).optional(),

  // Polling Configuration
  pollIntervalSeconds: Joi.number().integer().min(30).max(3600).optional(),
  enabled: Joi.boolean().optional(),
});
