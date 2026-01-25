import Joi from 'joi';

export const deviceIdSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const metricsQuerySchema = Joi.object({
  start: Joi.date().iso().optional(),
  end: Joi.date().iso().optional(),
  interval: Joi.number().integer().valid(60, 3600, 21600, 86400, 604800, 2592000).optional(),
});

export const multiDeviceMetricsQuerySchema = Joi.object({
  start: Joi.date().iso().optional(),
  end: Joi.date().iso().optional(),
  interval: Joi.number().integer().valid(60, 3600, 21600, 86400, 604800, 2592000).optional(),
  deviceIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
});

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
