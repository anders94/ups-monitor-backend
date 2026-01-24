import winston from 'winston';
import { config } from './env';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
if (!fs.existsSync(config.logging.filePath)) {
  fs.mkdirSync(config.logging.filePath, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
    level: config.logging.level,
  }),

  // Combined log file
  new winston.transports.File({
    filename: path.join(config.logging.filePath, 'combined.log'),
    format: logFormat,
    level: 'info',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  }),

  // Error log file
  new winston.transports.File({
    filename: path.join(config.logging.filePath, 'error.log'),
    format: logFormat,
    level: 'error',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  }),
];

const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Sanitize credentials from logs
logger.on('data', (log) => {
  if (log.meta?.snmpAuthKey) log.meta.snmpAuthKey = '[REDACTED]';
  if (log.meta?.snmpPrivKey) log.meta.snmpPrivKey = '[REDACTED]';
  if (log.meta?.password) log.meta.password = '[REDACTED]';
});

export default logger;
