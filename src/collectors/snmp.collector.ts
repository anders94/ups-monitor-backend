import deviceRepository from '../repositories/device.repository';
import metricsRepository from '../repositories/metrics.repository';
import eventsRepository from '../repositories/events.repository';
import snmpService from '../services/snmp.service';
import { transformMetricsToDbRow } from '../utils/transformers';
import logger from '../config/logger';

export class SnmpCollector {
  private isRunning = false;
  private lastPollTime?: Date;

  /**
   * Poll all enabled devices
   */
  async pollAllDevices(): Promise<void> {
    if (this.isRunning) {
      logger.warn('SNMP poll already in progress, skipping');
      return;
    }

    this.isRunning = true;
    this.lastPollTime = new Date();

    try {
      const devices = await deviceRepository.findEnabledDevices();

      if (devices.length === 0) {
        logger.info('No enabled devices to poll');
        return;
      }

      logger.info(`Polling ${devices.length} devices`);

      // Poll devices concurrently
      const results = await Promise.allSettled(
        devices.map((device) => this.pollDevice(device.id))
      );

      // Count successes and failures
      const successes = results.filter((r) => r.status === 'fulfilled').length;
      const failures = results.filter((r) => r.status === 'rejected').length;

      logger.info('SNMP poll completed', {
        total: devices.length,
        successes,
        failures,
      });
    } catch (error) {
      logger.error('Failed to poll devices', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Poll a single device
   */
  async pollDevice(deviceId: number): Promise<void> {
    const device = await deviceRepository.findById(deviceId);
    if (!device || !device.enabled) {
      return;
    }

    try {
      // Poll SNMP metrics
      const metrics = await snmpService.pollDevice(device);

      // Get previous metric to detect battery status changes
      const previousMetric = await metricsRepository.getLatestMetric(deviceId);

      // Store metrics
      const metricRow = transformMetricsToDbRow(deviceId, metrics);
      await metricsRepository.insertRawMetric(metricRow);

      // Handle battery event detection
      await this.handleBatteryEventDetection(
        deviceId,
        metrics.onBattery || false,
        previousMetric?.onBattery || false,
        metrics.batteryCapacityPercent,
        metrics.outputLoadPercent
      );

      // Update device poll status
      await deviceRepository.updatePollStatus(deviceId, true);

      logger.debug('Device polled successfully', {
        deviceId,
        deviceName: device.name,
        onBattery: metrics.onBattery,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Failed to poll device', {
        deviceId,
        deviceName: device.name,
        error: errorMsg,
      });

      // Update device poll status with error
      await deviceRepository.updatePollStatus(deviceId, false, errorMsg);
    }
  }

  /**
   * Handle battery event detection (on/off battery transitions)
   */
  private async handleBatteryEventDetection(
    deviceId: number,
    currentOnBattery: boolean,
    previousOnBattery: boolean,
    batteryCapacity?: number,
    loadPercent?: number
  ): Promise<void> {
    try {
      // Transition: Line power -> Battery (event start)
      if (currentOnBattery && !previousOnBattery) {
        logger.info('Battery event started', { deviceId });

        await eventsRepository.createBatteryEvent(
          deviceId,
          new Date(),
          batteryCapacity
        );
      }

      // Transition: Battery -> Line power (event end)
      if (!currentOnBattery && previousOnBattery) {
        logger.info('Battery event ended', { deviceId });

        const ongoingEvent = await eventsRepository.getOngoingEvent(deviceId);
        if (ongoingEvent) {
          // Calculate avg/max load during event
          // (simplified - in production, query metrics during event period)
          await eventsRepository.completeBatteryEvent(
            ongoingEvent.id,
            new Date(),
            batteryCapacity,
            loadPercent,
            loadPercent
          );
        }
      }
    } catch (error) {
      logger.error('Failed to handle battery event detection', {
        deviceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get last poll time
   */
  getLastPollTime(): Date | undefined {
    return this.lastPollTime;
  }

  /**
   * Check if collector is running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }
}

export default new SnmpCollector();
