import db from '../config/database';
import metricsRepository from '../repositories/metrics.repository';
import eventsRepository from '../repositories/events.repository';
import logger from '../config/logger';

export class AggregationService {
  /**
   * Aggregate hourly data (last complete hour)
   */
  async aggregateHourly(): Promise<void> {
    const now = new Date();
    const endOfLastHour = new Date(now);
    endOfLastHour.setMinutes(0, 0, 0);

    const startOfLastHour = new Date(endOfLastHour);
    startOfLastHour.setHours(startOfLastHour.getHours() - 1);

    await this.aggregateForPeriod(startOfLastHour, endOfLastHour, 3600, 'hourly');
  }

  /**
   * Aggregate daily data (yesterday)
   */
  async aggregateDaily(): Promise<void> {
    const now = new Date();
    const endOfYesterday = new Date(now);
    endOfYesterday.setHours(0, 0, 0, 0);

    const startOfYesterday = new Date(endOfYesterday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    await this.aggregateForPeriod(startOfYesterday, endOfYesterday, 86400, 'daily');
  }

  /**
   * Aggregate weekly data (last complete week)
   */
  async aggregateWeekly(): Promise<void> {
    const now = new Date();
    const endOfLastWeek = new Date(now);
    endOfLastWeek.setHours(0, 0, 0, 0);

    // Go back to last Sunday
    const dayOfWeek = endOfLastWeek.getDay();
    endOfLastWeek.setDate(endOfLastWeek.getDate() - dayOfWeek);

    const startOfLastWeek = new Date(endOfLastWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    await this.aggregateForPeriod(startOfLastWeek, endOfLastWeek, 604800, 'weekly');
  }

  /**
   * Aggregate monthly data (last complete month)
   */
  async aggregateMonthly(): Promise<void> {
    const now = new Date();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Approximate month duration (will be normalized in bucket)
    await this.aggregateForPeriod(startOfLastMonth, endOfLastMonth, 2592000, 'monthly');
  }

  /**
   * Aggregate data for a specific period
   */
  private async aggregateForPeriod(
    start: Date,
    end: Date,
    bucketDurationSeconds: number,
    periodName: string
  ): Promise<void> {
    logger.info(`Starting ${periodName} aggregation`, {
      start: start.toISOString(),
      end: end.toISOString(),
      bucketDurationSeconds,
    });

    try {
      const result = await db.query(`
        SELECT id as "deviceId"
        FROM devices
        WHERE enabled = true
      `);

      const deviceIds = result.rows.map((row: any) => row.deviceId);

      let totalInserted = 0;

      for (const deviceId of deviceIds) {
        const inserted = await this.aggregateDeviceMetrics(
          deviceId,
          start,
          end,
          bucketDurationSeconds
        );
        totalInserted += inserted;
      }

      logger.info(`Completed ${periodName} aggregation`, {
        deviceCount: deviceIds.length,
        bucketsInserted: totalInserted,
      });
    } catch (error) {
      logger.error(`Failed to aggregate ${periodName} data`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Aggregate metrics for a single device
   */
  private async aggregateDeviceMetrics(
    deviceId: number,
    start: Date,
    end: Date,
    bucketDurationSeconds: number
  ): Promise<number> {
    try {
      // Query to aggregate raw metrics into time buckets
      const result = await db.query(`
        SELECT
          device_id as "deviceId",
          date_trunc('hour', timestamp) +
            INTERVAL '1 second' * (EXTRACT(EPOCH FROM timestamp)::INTEGER / $4 * $4) as "bucketStart",
          $4 as "bucketDurationSeconds",

          -- Power metrics
          AVG(output_power_watts) as "avgOutputPowerWatts",
          MIN(output_power_watts) as "minOutputPowerWatts",
          MAX(output_power_watts) as "maxOutputPowerWatts",
          AVG(output_power_va) as "avgOutputPowerVa",
          MIN(output_power_va) as "minOutputPowerVa",
          MAX(output_power_va) as "maxOutputPowerVa",
          AVG(output_load_percent) as "avgOutputLoadPercent",
          MIN(output_load_percent) as "minOutputLoadPercent",
          MAX(output_load_percent) as "maxOutputLoadPercent",

          -- Battery metrics
          AVG(battery_capacity_percent) as "avgBatteryCapacityPercent",
          MIN(battery_capacity_percent) as "minBatteryCapacityPercent",
          MAX(battery_capacity_percent) as "maxBatteryCapacityPercent",
          AVG(battery_voltage) as "avgBatteryVoltage",
          MIN(battery_voltage) as "minBatteryVoltage",
          MAX(battery_voltage) as "maxBatteryVoltage",
          AVG(battery_temperature) as "avgBatteryTemperature",
          MIN(battery_temperature) as "minBatteryTemperature",
          MAX(battery_temperature) as "maxBatteryTemperature",
          AVG(battery_runtime_remaining_seconds) as "avgBatteryRuntimeRemainingSeconds",

          -- Input/Output metrics
          AVG(input_voltage) as "avgInputVoltage",
          AVG(output_voltage) as "avgOutputVoltage",
          AVG(input_frequency) as "avgInputFrequency",
          AVG(output_frequency) as "avgOutputFrequency",

          -- On-battery statistics
          COUNT(*) FILTER (WHERE on_battery = true) as "onBatterySampleCount",
          COUNT(*) FILTER (WHERE on_battery = true) * 60 as "onBatteryTotalSeconds",

          -- Data quality
          COUNT(*) as "sampleCount"

        FROM metrics_raw
        WHERE device_id = $1
          AND timestamp >= $2
          AND timestamp < $3
        GROUP BY device_id, "bucketStart"
      `, [deviceId, start, end, bucketDurationSeconds]);

      // Count battery events in period
      for (const row of result.rows) {
        const bucketEnd = new Date(row.bucketStart);
        bucketEnd.setSeconds(bucketEnd.getSeconds() + bucketDurationSeconds);

        const eventCount = await eventsRepository.countBatteryEvents(
          deviceId,
          row.bucketStart,
          bucketEnd
        );

        row.onBatteryEventCount = eventCount;

        // Insert aggregated metrics
        await metricsRepository.insertAggregatedMetric(row);
      }

      return result.rows.length;
    } catch (error) {
      logger.error('Failed to aggregate device metrics', {
        deviceId,
        start,
        end,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }
}

export default new AggregationService();
