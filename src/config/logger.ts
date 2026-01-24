import { config } from './env';

/**
 * Simple console logger (runit will add timestamps)
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

function formatMessage(level: string, message: string, meta?: any): string {
  let msg = `[${level}] ${message}`;
  if (meta && Object.keys(meta).length > 0) {
    // Sanitize credentials
    const sanitized = { ...meta };
    if (sanitized.snmpAuthKey) sanitized.snmpAuthKey = '[REDACTED]';
    if (sanitized.snmpPrivKey) sanitized.snmpPrivKey = '[REDACTED]';
    if (sanitized.password) sanitized.password = '[REDACTED]';
    msg += ` ${JSON.stringify(sanitized)}`;
  }
  return msg;
}

function shouldLog(level: LogLevel): boolean {
  const configuredLevel = config.logging.level as LogLevel;
  return LOG_LEVELS[level] <= LOG_LEVELS[configuredLevel];
}

const logger = {
  info: (message: string, meta?: any) => {
    if (shouldLog('info')) {
      console.log(formatMessage('info', message, meta));
    }
  },

  error: (message: string, meta?: any) => {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message, meta));
    }
  },

  warn: (message: string, meta?: any) => {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, meta));
    }
  },

  debug: (message: string, meta?: any) => {
    if (shouldLog('debug')) {
      console.log(formatMessage('debug', message, meta));
    }
  },
};

export default logger;
