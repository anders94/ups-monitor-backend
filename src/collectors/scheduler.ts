import cron from 'node-cron';
import snmpCollector from './snmp.collector';
import aggregationService from '../services/aggregation.service';
import retentionService from '../services/retention.service';
import { config } from '../config/env';
import logger from '../config/logger';

export class Scheduler {
  private jobs: cron.ScheduledTask[] = [];
  private isStarted = false;

  /**
   * Start all scheduled jobs
   */
  start(): void {
    if (this.isStarted) {
      logger.warn('Scheduler already started');
      return;
    }

    logger.info('Starting scheduler');

    // SNMP polling job (every minute by default)
    const pollInterval = config.polling.interval;
    const pollCron = this.secondsToCron(pollInterval);

    this.jobs.push(
      cron.schedule(pollCron, async () => {
        logger.debug('Running SNMP polling job');
        try {
          await snmpCollector.pollAllDevices();
        } catch (error) {
          logger.error('SNMP polling job failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      })
    );

    // Hourly aggregation
    this.jobs.push(
      cron.schedule(config.aggregation.hourlyCron, async () => {
        logger.info('Running hourly aggregation job');
        try {
          await aggregationService.aggregateHourly();
        } catch (error) {
          logger.error('Hourly aggregation job failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      })
    );

    // Daily aggregation
    this.jobs.push(
      cron.schedule(config.aggregation.dailyCron, async () => {
        logger.info('Running daily aggregation job');
        try {
          await aggregationService.aggregateDaily();
        } catch (error) {
          logger.error('Daily aggregation job failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      })
    );

    // Weekly aggregation
    this.jobs.push(
      cron.schedule(config.aggregation.weeklyCron, async () => {
        logger.info('Running weekly aggregation job');
        try {
          await aggregationService.aggregateWeekly();
        } catch (error) {
          logger.error('Weekly aggregation job failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      })
    );

    // Monthly aggregation (if configured)
    if (config.aggregation.monthlyCron) {
      this.jobs.push(
        cron.schedule(config.aggregation.monthlyCron, async () => {
          logger.info('Running monthly aggregation job');
          try {
            await aggregationService.aggregateMonthly();
          } catch (error) {
            logger.error('Monthly aggregation job failed', {
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        })
      );
    }

    // Data retention cleanup (daily at 2:00 AM)
    this.jobs.push(
      cron.schedule('0 2 * * *', async () => {
        logger.info('Running retention cleanup job');
        try {
          await retentionService.runCleanup();
        } catch (error) {
          logger.error('Retention cleanup job failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      })
    );

    this.isStarted = true;

    logger.info('Scheduler started', {
      pollInterval: `${pollInterval} seconds`,
      hourlyCron: config.aggregation.hourlyCron,
      dailyCron: config.aggregation.dailyCron,
      weeklyCron: config.aggregation.weeklyCron,
      jobCount: this.jobs.length,
    });

    // Run initial poll immediately
    setImmediate(() => {
      logger.info('Running initial SNMP poll');
      snmpCollector.pollAllDevices().catch((error) => {
        logger.error('Initial SNMP poll failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });
    });
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    if (!this.isStarted) {
      return;
    }

    logger.info('Stopping scheduler');

    for (const job of this.jobs) {
      job.stop();
    }

    this.jobs = [];
    this.isStarted = false;

    logger.info('Scheduler stopped');
  }

  /**
   * Convert seconds to cron expression
   */
  private secondsToCron(seconds: number): string {
    if (seconds < 60) {
      // Every N seconds (not supported by cron, fallback to every minute)
      return '* * * * *';
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      // Every N minutes
      return `*/${minutes} * * * *`;
    }

    // For longer intervals, default to every minute
    return '* * * * *';
  }

  /**
   * Check if scheduler is running
   */
  isRunning(): boolean {
    return this.isStarted;
  }

  /**
   * Get number of active jobs
   */
  getJobCount(): number {
    return this.jobs.length;
  }
}

export default new Scheduler();
