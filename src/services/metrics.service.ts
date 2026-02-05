import metricsRepository from '../repositories/metrics.repository';
import { MetricRaw, MetricAggregated } from '../types/database.types';
import { autoSelectBucketDuration } from '../utils/transformers';

export class MetricsService {
  // Pre-computed bucket sizes available in metrics_aggregated table
  private readonly PRE_COMPUTED_BUCKETS = [3600, 21600, 86400, 604800, 2592000];

  /**
   * Get latest metric for device
   */
  async getLatestMetric(deviceId: number): Promise<MetricRaw | null> {
    return metricsRepository.getLatestMetric(deviceId);
  }

  /**
   * Get power metrics for device
   */
  async getPowerMetrics(
    deviceId: number,
    start: Date,
    end: Date,
    interval?: number
  ): Promise<(MetricRaw | MetricAggregated)[]> {
    // Auto-select interval if not provided
    const bucketDuration = interval || autoSelectBucketDuration(start, end);

    // Use raw data for short intervals (1 minute)
    if (bucketDuration === 60) {
      return metricsRepository.getRawMetrics(deviceId, start, end);
    }

    // Use pre-computed aggregated data if available
    if (this.PRE_COMPUTED_BUCKETS.includes(bucketDuration)) {
      return metricsRepository.getAggregatedMetrics(deviceId, start, end, bucketDuration);
    }

    // Use dynamic aggregation for custom bucket sizes
    return metricsRepository.getDynamicAggregatedMetrics(deviceId, start, end, bucketDuration);
  }

  /**
   * Get battery metrics for device
   */
  async getBatteryMetrics(
    deviceId: number,
    start: Date,
    end: Date,
    interval?: number
  ): Promise<(MetricRaw | MetricAggregated)[]> {
    // Same logic as power metrics
    return this.getPowerMetrics(deviceId, start, end, interval);
  }

  /**
   * Get total power metrics across multiple devices
   */
  async getTotalPowerMetrics(
    deviceIds: number[],
    start: Date,
    end: Date,
    interval?: number
  ): Promise<any[]> {
    const bucketDuration = interval || autoSelectBucketDuration(start, end);

    // Get aggregated metrics for all devices
    const metrics = await metricsRepository.getMultiDeviceAggregatedMetrics(
      deviceIds,
      start,
      end,
      bucketDuration
    );

    // Group by bucket_start and sum power values
    const grouped: Record<string, any> = {};

    for (const metric of metrics) {
      const key = metric.bucketStart.toISOString();

      if (!grouped[key]) {
        grouped[key] = {
          bucketStart: metric.bucketStart,
          bucketDurationSeconds: metric.bucketDurationSeconds,
          totalPowerWatts: 0,
          totalPowerVa: 0,
          avgLoadPercent: 0,
          deviceCount: 0,
          sampleCount: 0,
        };
      }

      grouped[key].totalPowerWatts += metric.avgOutputPowerWatts || 0;
      grouped[key].totalPowerVa += metric.avgOutputPowerVa || 0;
      grouped[key].avgLoadPercent += metric.avgOutputLoadPercent || 0;
      grouped[key].deviceCount += 1;
      grouped[key].sampleCount += metric.sampleCount;
    }

    // Calculate averages
    const result = Object.values(grouped).map((item) => ({
      ...item,
      avgLoadPercent: item.deviceCount > 0 ? item.avgLoadPercent / item.deviceCount : 0,
    }));

    return result;
  }

  /**
   * Get metrics statistics
   */
  async getMetricsStatistics() {
    return metricsRepository.getStatistics();
  }
}

export default new MetricsService();
