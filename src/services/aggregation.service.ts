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
        SELECT device_id
        FROM devices
        WHERE enabled = true
      `);

      const deviceIds = result.rows.map((row: any) => row.device_id);

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
          device_id,
          date_trunc('hour', timestamp) +
            INTERVAL '1 second' * (EXTRACT(EPOCH FROM timestamp)::INTEGER / $4 * $4) as bucket_start,
          $4 as bucket_duration_seconds,

          -- Power metrics
          AVG(output_power_watts) as avg_output_power_watts,
          MIN(output_power_watts) as min_output_power_watts,
          MAX(output_power_watts) as max_output_power_watts,
          AVG(output_power_va) as avg_output_power_va,
          MIN(output_power_va) as min_output_power_va,
          MAX(output_power_va) as max_output_power_va,
          AVG(output_load_percent) as avg_output_load_percent,
          MIN(output_load_percent) as min_output_load_percent,
          MAX(output_load_percent) as max_output_load_percent,

          -- Battery metrics
          AVG(battery_capacity_percent) as avg_battery_capacity_percent,
          MIN(battery_capacity_percent) as min_battery_capacity_percent,
          MAX(battery_capacity_percent) as max_battery_capacity_percent,
          AVG(battery_voltage) as avg_battery_voltage,
          MIN(battery_voltage) as min_battery_voltage,
          MAX(battery_voltage) as max_battery_voltage,
          AVG(battery_temperature) as avg_battery_temperature,
          MIN(battery_temperature) as min_battery_temperature,
          MAX(battery_temperature) as max_battery_temperature,
          AVG(battery_runtime_remaining_seconds) as avg_battery_runtime_remaining_seconds,

          -- Input/Output metrics
          AVG(input_voltage) as avg_input_voltage,
          AVG(output_voltage) as avg_output_voltage,
          AVG(input_frequency) as avg_input_frequency,
          AVG(output_frequency) as avg_output_frequency,

          -- On-battery statistics
          COUNT(*) FILTER (WHERE on_battery = true) as on_battery_sample_count,
          COUNT(*) FILTER (WHERE on_battery = true) * 60 as on_battery_total_seconds,

          -- Data quality
          COUNT(*) as sample_count

        FROM metrics_raw
        WHERE device_id = $1
          AND timestamp >= $2
          AND timestamp < $3
        GROUP BY device_id, bucket_start
      `, [deviceId, start, end, bucketDurationSeconds]);

      // Count battery events in period
      for (const row of result.rows) {
        const bucketEnd = new Date(row.bucket_start);
        bucketEnd.setSeconds(bucketEnd.getSeconds() + bucketDurationSeconds);

        const eventCount = await eventsRepository.countBatteryEvents(
          deviceId,
          row.bucket_start,
          bucketEnd
        );

        row.on_battery_event_count = eventCount;

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
