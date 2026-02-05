import Joi from 'joi';

export const deviceIdSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const metricsQuerySchema = Joi.object({
  start: Joi.date().iso().optional(),
  end: Joi.date().iso().optional(),
  interval: Joi.number().integer().valid(60, 3600, 21600, 86400, 604800, 2592000).optional(),
  bucket: Joi.number().integer().min(60).max(86400).optional(),
}).or('interval', 'bucket');

export const multiDeviceMetricsQuerySchema = Joi.object({
  start: Joi.date().iso().optional(),
  end: Joi.date().iso().optional(),
  interval: Joi.number().integer().valid(60, 3600, 21600, 86400, 604800, 2592000).optional(),
  bucket: Joi.number().integer().min(60).max(86400).optional(),
  deviceIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
}).or('interval', 'bucket');

export const batteryEventsQuerySchema = Joi.object({
  start: Joi.date().iso().optional(),
  end: Joi.date().iso().optional(),
  limit: Joi.number().integer().min(1).max(1000).default(100),
});

export const multiDeviceBatteryEventsQuerySchema = Joi.object({
  start: Joi.date().iso().optional(),
  end: Joi.date().iso().optional(),
  limit: Joi.number().integer().min(1).max(1000).default(100),
  deviceIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
});
