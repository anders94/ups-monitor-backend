import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const envSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  HOST: Joi.string().default('localhost'),
  PORT: Joi.number().default(3000),
  API_KEY: Joi.string().optional(),

  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_POOL_MIN: Joi.number().default(2),
  DB_POOL_MAX: Joi.number().default(10),

  // SNMP
  SNMP_TIMEOUT: Joi.number().default(5000),
  SNMP_RETRIES: Joi.number().default(1),

  // Polling
  POLL_INTERVAL: Joi.number().default(60),

  // Aggregation (cron expressions)
  AGGREGATION_HOURLY_CRON: Joi.string().default('0 * * * *'),
  AGGREGATION_SIX_HOURLY_CRON: Joi.string().default('0 */6 * * *'),
  AGGREGATION_DAILY_CRON: Joi.string().default('5 0 * * *'),
  AGGREGATION_WEEKLY_CRON: Joi.string().default('15 0 * * 0'),
  AGGREGATION_MONTHLY_CRON: Joi.string().default('30 0 1 * *'),

  // Data Retention (days)
  RETENTION_RAW_DAYS: Joi.number().default(30),
  RETENTION_HOURLY_DAYS: Joi.number().default(365),
  RETENTION_SIX_HOURLY_DAYS: Joi.number().default(180),
  RETENTION_DAILY_DAYS: Joi.number().default(1095),
  RETENTION_WEEKLY_DAYS: Joi.number().default(1825),

  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

export const config = {
  app: {
    env: envVars.NODE_ENV as string,
    host: envVars.HOST as string,
    port: envVars.PORT as number,
    apiKey: envVars.API_KEY as string | undefined,
    isDevelopment: envVars.NODE_ENV === 'development',
    isProduction: envVars.NODE_ENV === 'production',
    isTest: envVars.NODE_ENV === 'test',
  },
  database: {
    host: envVars.DB_HOST as string,
    port: envVars.DB_PORT as number,
    database: envVars.DB_NAME as string,
    user: envVars.DB_USER as string,
    password: envVars.DB_PASSWORD as string,
    poolMin: envVars.DB_POOL_MIN as number,
    poolMax: envVars.DB_POOL_MAX as number,
  },
  snmp: {
    timeout: envVars.SNMP_TIMEOUT as number,
    retries: envVars.SNMP_RETRIES as number,
  },
  polling: {
    interval: envVars.POLL_INTERVAL as number,
  },
  aggregation: {
    hourlyCron: envVars.AGGREGATION_HOURLY_CRON as string,
    sixHourlyCron: envVars.AGGREGATION_SIX_HOURLY_CRON as string,
    dailyCron: envVars.AGGREGATION_DAILY_CRON as string,
    weeklyCron: envVars.AGGREGATION_WEEKLY_CRON as string,
    monthlyCron: envVars.AGGREGATION_MONTHLY_CRON as string,
  },
  retention: {
    rawDays: envVars.RETENTION_RAW_DAYS as number,
    hourlyDays: envVars.RETENTION_HOURLY_DAYS as number,
    sixHourlyDays: envVars.RETENTION_SIX_HOURLY_DAYS as number,
    dailyDays: envVars.RETENTION_DAILY_DAYS as number,
    weeklyDays: envVars.RETENTION_WEEKLY_DAYS as number,
  },
  logging: {
    level: envVars.LOG_LEVEL as string,
  },
};

export default config;
