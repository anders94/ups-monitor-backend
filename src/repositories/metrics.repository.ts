import db from '../config/database';
import { MetricRaw, MetricAggregated } from '../types/database.types';
import { DatabaseError } from '../utils/errors';
import logger from '../config/logger';

export class MetricsRepository {
  /**
   * Insert raw metric
   */
  async insertRawMetric(metric: Partial<MetricRaw>): Promise<MetricRaw> {
    try {
      const result = await db.query<any>(`
        INSERT INTO metrics_raw (
          device_id, timestamp,
          output_power_watts, output_power_va, output_load_percent,
          battery_status, battery_capacity_percent, battery_voltage,
          battery_temperature, battery_runtime_remaining_seconds,
          input_voltage, input_frequency, input_current,
          output_voltage, output_frequency, output_current,
          on_battery, on_line, on_bypass, alarms_present
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        ) RETURNING
          id,
          device_id as "deviceId",
          timestamp,
          output_power_watts as "outputPowerWatts",
          output_power_va as "outputPowerVa",
          output_load_percent as "outputLoadPercent",
          battery_status as "batteryStatus",
          battery_capacity_percent as "batteryCapacityPercent",
          battery_voltage as "batteryVoltage",
          battery_temperature as "batteryTemperature",
          battery_runtime_remaining_seconds as "batteryRuntimeRemainingSeconds",
          input_voltage as "inputVoltage",
          input_frequency as "inputFrequency",
          input_current as "inputCurrent",
          output_voltage as "outputVoltage",
          output_frequency as "outputFrequency",
          output_current as "outputCurrent",
          on_battery as "onBattery",
          on_line as "onLine",
          on_bypass as "onBypass",
          alarms_present as "alarmsPresent",
          created_at as "createdAt"
      `, [
        metric.deviceId,
        metric.timestamp || new Date(),
        metric.outputPowerWatts,
        metric.outputPowerVa,
        metric.outputLoadPercent,
        metric.batteryStatus,
        metric.batteryCapacityPercent,
        metric.batteryVoltage,
        metric.batteryTemperature,
        metric.batteryRuntimeRemainingSeconds,
        metric.inputVoltage,
        metric.inputFrequency,
        metric.inputCurrent,
        metric.outputVoltage,
        metric.outputFrequency,
        metric.outputCurrent,
        metric.onBattery || false,
        metric.onLine !== undefined ? metric.onLine : true,
        metric.onBypass || false,
        metric.alarmsPresent || false,
      ]);

      return result.rows[0] as MetricRaw;
    } catch (error) {
      logger.error('Failed to insert raw metric', { deviceId: metric.deviceId, error });
      throw new DatabaseError('Failed to insert raw metric');
    }
  }

  /**
   * Get latest metric for device
   */
  async getLatestMetric(deviceId: number): Promise<MetricRaw | null> {
    try {
      const result = await db.query<any>(`
        SELECT
          id,
          device_id as "deviceId",
          timestamp,
          output_power_watts as "outputPowerWatts",
          output_power_va as "outputPowerVa",
          output_load_percent as "outputLoadPercent",
          battery_status as "batteryStatus",
          battery_capacity_percent as "batteryCapacityPercent",
          battery_voltage as "batteryVoltage",
          battery_temperature as "batteryTemperature",
          battery_runtime_remaining_seconds as "batteryRuntimeRemainingSeconds",
          input_voltage as "inputVoltage",
          input_frequency as "inputFrequency",
          input_current as "inputCurrent",
          output_voltage as "outputVoltage",
          output_frequency as "outputFrequency",
          output_current as "outputCurrent",
          on_battery as "onBattery",
          on_line as "onLine",
          on_bypass as "onBypass",
          alarms_present as "alarmsPresent",
          created_at as "createdAt"
        FROM metrics_raw
        WHERE device_id = $1
        ORDER BY timestamp DESC
        LIMIT 1
      `, [deviceId]);

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to get latest metric', { deviceId, error });
      throw new DatabaseError('Failed to get latest metric');
    }
  }

  /**
   * Get raw metrics in time range
   */
  async getRawMetrics(
    deviceId: number,
    start: Date,
    end: Date
  ): Promise<MetricRaw[]> {
    try {
      const result = await db.query<any>(`
        SELECT
          id,
          device_id as "deviceId",
          timestamp,
          output_power_watts as "outputPowerWatts",
          output_power_va as "outputPowerVa",
          output_load_percent as "outputLoadPercent",
          battery_status as "batteryStatus",
          battery_capacity_percent as "batteryCapacityPercent",
          battery_voltage as "batteryVoltage",
          battery_temperature as "batteryTemperature",
          battery_runtime_remaining_seconds as "batteryRuntimeRemainingSeconds",
          input_voltage as "inputVoltage",
          input_frequency as "inputFrequency",
          input_current as "inputCurrent",
          output_voltage as "outputVoltage",
          output_frequency as "outputFrequency",
          output_current as "outputCurrent",
          on_battery as "onBattery",
          on_line as "onLine",
          on_bypass as "onBypass",
          alarms_present as "alarmsPresent",
          created_at as "createdAt"
        FROM metrics_raw
        WHERE device_id = $1
          AND timestamp >= $2
          AND timestamp <= $3
        ORDER BY timestamp ASC
      `, [deviceId, start, end]);

      return result.rows as MetricRaw[];
    } catch (error) {
      logger.error('Failed to get raw metrics', { deviceId, start, end, error });
      throw new DatabaseError('Failed to get raw metrics');
    }
  }

  /**
   * Get aggregated metrics in time range
   */
  async getAggregatedMetrics(
    deviceId: number,
    start: Date,
    end: Date,
    bucketDurationSeconds: number
  ): Promise<MetricAggregated[]> {
    try {
      const result = await db.query<any>(`
        SELECT
          id,
          device_id as "deviceId",
          bucket_start as "bucketStart",
          bucket_duration_seconds as "bucketDurationSeconds",
          avg_output_power_watts as "avgOutputPowerWatts",
          min_output_power_watts as "minOutputPowerWatts",
          max_output_power_watts as "maxOutputPowerWatts",
          avg_output_power_va as "avgOutputPowerVa",
          min_output_power_va as "minOutputPowerVa",
          max_output_power_va as "maxOutputPowerVa",
          avg_output_load_percent as "avgOutputLoadPercent",
          min_output_load_percent as "minOutputLoadPercent",
          max_output_load_percent as "maxOutputLoadPercent",
          avg_battery_capacity_percent as "avgBatteryCapacityPercent",
          min_battery_capacity_percent as "minBatteryCapacityPercent",
          max_battery_capacity_percent as "maxBatteryCapacityPercent",
          avg_battery_voltage as "avgBatteryVoltage",
          min_battery_voltage as "minBatteryVoltage",
          max_battery_voltage as "maxBatteryVoltage",
          avg_battery_temperature as "avgBatteryTemperature",
          min_battery_temperature as "minBatteryTemperature",
          max_battery_temperature as "maxBatteryTemperature",
          avg_battery_runtime_remaining_seconds as "avgBatteryRuntimeRemainingSeconds",
          avg_input_voltage as "avgInputVoltage",
          avg_output_voltage as "avgOutputVoltage",
          avg_input_frequency as "avgInputFrequency",
          avg_output_frequency as "avgOutputFrequency",
          on_battery_sample_count as "onBatterySampleCount",
          on_battery_total_seconds as "onBatteryTotalSeconds",
          on_battery_event_count as "onBatteryEventCount",
          sample_count as "sampleCount",
          created_at as "createdAt"
        FROM metrics_aggregated
        WHERE device_id = $1
          AND bucket_duration_seconds = $2
          AND bucket_start >= $3
          AND bucket_start <= $4
        ORDER BY bucket_start ASC
      `, [deviceId, bucketDurationSeconds, start, end]);

      return result.rows as MetricAggregated[];
    } catch (error) {
      logger.error('Failed to get aggregated metrics', { deviceId, start, end, error });
      throw new DatabaseError('Failed to get aggregated metrics');
    }
  }

  /**
   * Get aggregated metrics for multiple devices
   */
  async getMultiDeviceAggregatedMetrics(
    deviceIds: number[],
    start: Date,
    end: Date,
    bucketDurationSeconds: number
  ): Promise<MetricAggregated[]> {
    try {
      const result = await db.query<any>(`
        SELECT
          id,
          device_id as "deviceId",
          bucket_start as "bucketStart",
          bucket_duration_seconds as "bucketDurationSeconds",
          avg_output_power_watts as "avgOutputPowerWatts",
          min_output_power_watts as "minOutputPowerWatts",
          max_output_power_watts as "maxOutputPowerWatts",
          avg_output_power_va as "avgOutputPowerVa",
          min_output_power_va as "minOutputPowerVa",
          max_output_power_va as "maxOutputPowerVa",
          avg_output_load_percent as "avgOutputLoadPercent",
          min_output_load_percent as "minOutputLoadPercent",
          max_output_load_percent as "maxOutputLoadPercent",
          avg_battery_capacity_percent as "avgBatteryCapacityPercent",
          min_battery_capacity_percent as "minBatteryCapacityPercent",
          max_battery_capacity_percent as "maxBatteryCapacityPercent",
          avg_battery_voltage as "avgBatteryVoltage",
          min_battery_voltage as "minBatteryVoltage",
          max_battery_voltage as "maxBatteryVoltage",
          avg_battery_temperature as "avgBatteryTemperature",
          min_battery_temperature as "minBatteryTemperature",
          max_battery_temperature as "maxBatteryTemperature",
          avg_battery_runtime_remaining_seconds as "avgBatteryRuntimeRemainingSeconds",
          avg_input_voltage as "avgInputVoltage",
          avg_output_voltage as "avgOutputVoltage",
          avg_input_frequency as "avgInputFrequency",
          avg_output_frequency as "avgOutputFrequency",
          on_battery_sample_count as "onBatterySampleCount",
          on_battery_total_seconds as "onBatteryTotalSeconds",
          on_battery_event_count as "onBatteryEventCount",
          sample_count as "sampleCount",
          created_at as "createdAt"
        FROM metrics_aggregated
        WHERE device_id = ANY($1)
          AND bucket_duration_seconds = $2
          AND bucket_start >= $3
          AND bucket_start <= $4
        ORDER BY bucket_start ASC, device_id ASC
      `, [deviceIds, bucketDurationSeconds, start, end]);

      return result.rows as MetricAggregated[];
    } catch (error) {
      logger.error('Failed to get multi-device aggregated metrics', { deviceIds, start, end, error });
      throw new DatabaseError('Failed to get multi-device aggregated metrics');
    }
  }

  /**
   * Insert aggregated metric (with upsert logic)
   */
  async insertAggregatedMetric(metric: Partial<MetricAggregated>): Promise<void> {
    try {
      await db.query(`
        INSERT INTO metrics_aggregated (
          device_id, bucket_start, bucket_duration_seconds,
          avg_output_power_watts, min_output_power_watts, max_output_power_watts,
          avg_output_power_va, min_output_power_va, max_output_power_va,
          avg_output_load_percent, min_output_load_percent, max_output_load_percent,
          avg_battery_capacity_percent, min_battery_capacity_percent, max_battery_capacity_percent,
          avg_battery_voltage, min_battery_voltage, max_battery_voltage,
          avg_battery_temperature, min_battery_temperature, max_battery_temperature,
          avg_battery_runtime_remaining_seconds,
          avg_input_voltage, avg_output_voltage, avg_input_frequency, avg_output_frequency,
          on_battery_sample_count, on_battery_total_seconds, on_battery_event_count,
          sample_count
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17, $18, $19, $20, $21, $22,
          $23, $24, $25, $26, $27, $28, $29, $30
        )
        ON CONFLICT (device_id, bucket_duration_seconds, bucket_start)
        DO UPDATE SET
          avg_output_power_watts = EXCLUDED.avg_output_power_watts,
          min_output_power_watts = EXCLUDED.min_output_power_watts,
          max_output_power_watts = EXCLUDED.max_output_power_watts,
          avg_output_power_va = EXCLUDED.avg_output_power_va,
          min_output_power_va = EXCLUDED.min_output_power_va,
          max_output_power_va = EXCLUDED.max_output_power_va,
          avg_output_load_percent = EXCLUDED.avg_output_load_percent,
          min_output_load_percent = EXCLUDED.min_output_load_percent,
          max_output_load_percent = EXCLUDED.max_output_load_percent,
          avg_battery_capacity_percent = EXCLUDED.avg_battery_capacity_percent,
          min_battery_capacity_percent = EXCLUDED.min_battery_capacity_percent,
          max_battery_capacity_percent = EXCLUDED.max_battery_capacity_percent,
          avg_battery_voltage = EXCLUDED.avg_battery_voltage,
          min_battery_voltage = EXCLUDED.min_battery_voltage,
          max_battery_voltage = EXCLUDED.max_battery_voltage,
          avg_battery_temperature = EXCLUDED.avg_battery_temperature,
          min_battery_temperature = EXCLUDED.min_battery_temperature,
          max_battery_temperature = EXCLUDED.max_battery_temperature,
          avg_battery_runtime_remaining_seconds = EXCLUDED.avg_battery_runtime_remaining_seconds,
          avg_input_voltage = EXCLUDED.avg_input_voltage,
          avg_output_voltage = EXCLUDED.avg_output_voltage,
          avg_input_frequency = EXCLUDED.avg_input_frequency,
          avg_output_frequency = EXCLUDED.avg_output_frequency,
          on_battery_sample_count = EXCLUDED.on_battery_sample_count,
          on_battery_total_seconds = EXCLUDED.on_battery_total_seconds,
          on_battery_event_count = EXCLUDED.on_battery_event_count,
          sample_count = EXCLUDED.sample_count
      `, [
        metric.deviceId,
        metric.bucketStart,
        metric.bucketDurationSeconds,
        metric.avgOutputPowerWatts,
        metric.minOutputPowerWatts,
        metric.maxOutputPowerWatts,
        metric.avgOutputPowerVa,
        metric.minOutputPowerVa,
        metric.maxOutputPowerVa,
        metric.avgOutputLoadPercent,
        metric.minOutputLoadPercent,
        metric.maxOutputLoadPercent,
        metric.avgBatteryCapacityPercent,
        metric.minBatteryCapacityPercent,
        metric.maxBatteryCapacityPercent,
        metric.avgBatteryVoltage,
        metric.minBatteryVoltage,
        metric.maxBatteryVoltage,
        metric.avgBatteryTemperature,
        metric.minBatteryTemperature,
        metric.maxBatteryTemperature,
        metric.avgBatteryRuntimeRemainingSeconds,
        metric.avgInputVoltage,
        metric.avgOutputVoltage,
        metric.avgInputFrequency,
        metric.avgOutputFrequency,
        metric.onBatterySampleCount,
        metric.onBatteryTotalSeconds,
        metric.onBatteryEventCount,
        metric.sampleCount,
      ]);
    } catch (error) {
      logger.error('Failed to insert aggregated metric', { deviceId: metric.deviceId, error });
      throw new DatabaseError('Failed to insert aggregated metric');
    }
  }

  /**
   * Delete old raw metrics
   */
  async deleteOldRawMetrics(olderThan: Date): Promise<number> {
    try {
      const result = await db.query(`
        DELETE FROM metrics_raw
        WHERE timestamp < $1
      `, [olderThan]);

      return result.rowCount || 0;
    } catch (error) {
      logger.error('Failed to delete old raw metrics', { olderThan, error });
      throw new DatabaseError('Failed to delete old raw metrics');
    }
  }

  /**
   * Delete old aggregated metrics
   */
  async deleteOldAggregatedMetrics(
    bucketDurationSeconds: number,
    olderThan: Date
  ): Promise<number> {
    try {
      const result = await db.query(`
        DELETE FROM metrics_aggregated
        WHERE bucket_duration_seconds = $1
          AND bucket_start < $2
      `, [bucketDurationSeconds, olderThan]);

      return result.rowCount || 0;
    } catch (error) {
      logger.error('Failed to delete old aggregated metrics', { bucketDurationSeconds, olderThan, error });
      throw new DatabaseError('Failed to delete old aggregated metrics');
    }
  }

  /**
   * Get metrics statistics
   */
  async getStatistics() {
    try {
      const result = await db.query(`
        SELECT
          (SELECT COUNT(*) FROM metrics_raw) as raw_count,
          (SELECT COUNT(*) FROM metrics_aggregated) as aggregated_count,
          (SELECT MIN(timestamp) FROM metrics_raw) as oldest_raw,
          (SELECT MAX(timestamp) FROM metrics_raw) as newest_raw
      `);

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get metrics statistics', { error });
      throw new DatabaseError('Failed to get metrics statistics');
    }
  }
}

export default new MetricsRepository();
