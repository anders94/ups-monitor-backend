import metricsRepository from '../repositories/metrics.repository';
import eventsRepository from '../repositories/events.repository';
import { config } from '../config/env';
import logger from '../config/logger';

export class RetentionService {
  /**
   * Run all retention cleanup tasks
   */
  async runCleanup(): Promise<void> {
    logger.info('Starting retention cleanup');

    try {
      await this.cleanupRawMetrics();
      await this.cleanupHourlyAggregates();
      await this.cleanupDailyAggregates();
      await this.cleanupWeeklyAggregates();
      await this.cleanupBatteryEvents();

      logger.info('Retention cleanup completed successfully');
    } catch (error) {
      logger.error('Retention cleanup failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Delete old raw metrics
   */
  async cleanupRawMetrics(): Promise<void> {
    const retentionDays = config.retention.rawDays;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    logger.info('Cleaning up raw metrics', { retentionDays, cutoffDate });

    const deletedCount = await metricsRepository.deleteOldRawMetrics(cutoffDate);

    logger.info('Raw metrics cleanup completed', { deletedCount });
  }

  /**
   * Delete old hourly aggregates
   */
  async cleanupHourlyAggregates(): Promise<void> {
    const retentionDays = config.retention.hourlyDays;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    logger.info('Cleaning up hourly aggregates', { retentionDays, cutoffDate });

    const deletedCount = await metricsRepository.deleteOldAggregatedMetrics(3600, cutoffDate);

    logger.info('Hourly aggregates cleanup completed', { deletedCount });
  }

  /**
   * Delete old daily aggregates
   */
  async cleanupDailyAggregates(): Promise<void> {
    const retentionDays = config.retention.dailyDays;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    logger.info('Cleaning up daily aggregates', { retentionDays, cutoffDate });

    const deletedCount = await metricsRepository.deleteOldAggregatedMetrics(86400, cutoffDate);

    logger.info('Daily aggregates cleanup completed', { deletedCount });
  }

  /**
   * Delete old weekly aggregates
   */
  async cleanupWeeklyAggregates(): Promise<void> {
    const retentionDays = config.retention.weeklyDays;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    logger.info('Cleaning up weekly aggregates', { retentionDays, cutoffDate });

    const deletedCount = await metricsRepository.deleteOldAggregatedMetrics(604800, cutoffDate);

    logger.info('Weekly aggregates cleanup completed', { deletedCount });
  }

  /**
   * Delete old battery events
   */
  async cleanupBatteryEvents(): Promise<void> {
    // Use daily retention policy for battery events
    const retentionDays = config.retention.dailyDays;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    logger.info('Cleaning up battery events', { retentionDays, cutoffDate });

    const deletedCount = await eventsRepository.deleteOldBatteryEvents(cutoffDate);

    logger.info('Battery events cleanup completed', { deletedCount });
  }
}

export default new RetentionService();
