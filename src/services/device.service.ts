import deviceRepository from '../repositories/device.repository';
import { Device } from '../types/database.types';
import { DeviceCreateInput, DeviceUpdateInput } from '../types/api.types';
import { validateSnmpCredentials } from '../utils/validators';
import snmpService from './snmp.service';
import logger from '../config/logger';

export class DeviceService {
  /**
   * Get all devices
   */
  async getAllDevices(): Promise<Device[]> {
    return deviceRepository.findAll();
  }

  /**
   * Get device by ID
   */
  async getDeviceById(id: number): Promise<Device | null> {
    return deviceRepository.findById(id);
  }

  /**
   * Get enabled devices
   */
  async getEnabledDevices(): Promise<Device[]> {
    return deviceRepository.findEnabledDevices();
  }

  /**
   * Create new device
   */
  async createDevice(input: DeviceCreateInput): Promise<Device> {
    // Validate SNMP credentials
    validateSnmpCredentials(
      input.snmpUsername,
      input.snmpAuthProtocol,
      input.snmpAuthKey,
      input.snmpPrivProtocol,
      input.snmpPrivKey,
      input.snmpSecurityLevel || 'authPriv'
    );

    // Create device
    const device = await deviceRepository.create(input);

    logger.info('Device created successfully', {
      deviceId: device.id,
      name: device.name,
      host: device.host,
    });

    return device;
  }

  /**
   * Update device
   */
  async updateDevice(id: number, input: DeviceUpdateInput): Promise<Device> {
    // Validate SNMP credentials if provided
    if (input.snmpUsername || input.snmpAuthProtocol || input.snmpAuthKey ||
        input.snmpPrivProtocol || input.snmpPrivKey || input.snmpSecurityLevel) {

      const existing = await deviceRepository.findById(id);
      if (!existing) {
        throw new Error('Device not found');
      }

      validateSnmpCredentials(
        input.snmpUsername || existing.snmpUsername,
        input.snmpAuthProtocol || existing.snmpAuthProtocol,
        input.snmpAuthKey || existing.snmpAuthKey,
        input.snmpPrivProtocol || existing.snmpPrivProtocol,
        input.snmpPrivKey || existing.snmpPrivKey,
        input.snmpSecurityLevel || existing.snmpSecurityLevel
      );
    }

    const device = await deviceRepository.update(id, input);

    logger.info('Device updated successfully', { deviceId: id });

    return device;
  }

  /**
   * Delete device
   */
  async deleteDevice(id: number): Promise<void> {
    await deviceRepository.delete(id);
    logger.info('Device deleted successfully', { deviceId: id });
  }

  /**
   * Test device connection
   */
  async testDeviceConnection(id: number): Promise<boolean> {
    const device = await deviceRepository.findById(id);
    if (!device) {
      throw new Error('Device not found');
    }

    try {
      const success = await snmpService.testConnection(device);
      logger.info('Device connection test', {
        deviceId: id,
        success,
      });
      return success;
    } catch (error) {
      logger.error('Device connection test failed', {
        deviceId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Get device statistics
   */
  async getDeviceStatistics() {
    return deviceRepository.getStatistics();
  }
}

export default new DeviceService();
