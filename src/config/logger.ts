/**
 * Simple console logger (runit will add timestamps)
 */

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

const logger = {
  info: (message: string, meta?: any) => {
    console.log(formatMessage('info', message, meta));
  },

  error: (message: string, meta?: any) => {
    console.error(formatMessage('error', message, meta));
  },

  warn: (message: string, meta?: any) => {
    console.warn(formatMessage('warn', message, meta));
  },

  debug: (message: string, meta?: any) => {
    console.log(formatMessage('debug', message, meta));
  },
};

export default logger;
