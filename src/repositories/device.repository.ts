import db from '../config/database';
import { Device } from '../types/database.types';
import { DeviceCreateInput, DeviceUpdateInput } from '../types/api.types';
import { DatabaseError, NotFoundError } from '../utils/errors';
import logger from '../config/logger';

export class DeviceRepository {
  /**
   * Find all devices
   */
  async findAll(): Promise<Device[]> {
    try {
      const result = await db.query(`
        SELECT
          id, name, host, port, manufacturer, model,
          snmp_version as "snmpVersion",
          snmp_username as "snmpUsername",
          snmp_auth_protocol as "snmpAuthProtocol",
          snmp_auth_key as "snmpAuthKey",
          snmp_priv_protocol as "snmpPrivProtocol",
          snmp_priv_key as "snmpPrivKey",
          snmp_security_level as "snmpSecurityLevel",
          oid_profile as "oidProfile",
          oid_overrides as "oidOverrides",
          poll_interval_seconds as "pollIntervalSeconds",
          enabled,
          last_poll_at as "lastPollAt",
          last_poll_success as "lastPollSuccess",
          last_poll_error as "lastPollError",
          consecutive_failures as "consecutiveFailures",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM devices
        ORDER BY name ASC
      `);
      return result.rows as Device[];
    } catch (error) {
      logger.error('Failed to fetch devices', { error });
      throw new DatabaseError('Failed to fetch devices');
    }
  }

  /**
   * Find device by ID
   */
  async findById(id: number): Promise<Device | null> {
    try {
      const result = await db.query(`
        SELECT
          id, name, host, port, manufacturer, model,
          snmp_version as "snmpVersion",
          snmp_username as "snmpUsername",
          snmp_auth_protocol as "snmpAuthProtocol",
          snmp_auth_key as "snmpAuthKey",
          snmp_priv_protocol as "snmpPrivProtocol",
          snmp_priv_key as "snmpPrivKey",
          snmp_security_level as "snmpSecurityLevel",
          oid_profile as "oidProfile",
          oid_overrides as "oidOverrides",
          poll_interval_seconds as "pollIntervalSeconds",
          enabled,
          last_poll_at as "lastPollAt",
          last_poll_success as "lastPollSuccess",
          last_poll_error as "lastPollError",
          consecutive_failures as "consecutiveFailures",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM devices
        WHERE id = $1
      `, [id]);
      return (result.rows[0] as Device) || null;
    } catch (error) {
      logger.error('Failed to fetch device by ID', { id, error });
      throw new DatabaseError('Failed to fetch device');
    }
  }

  /**
   * Find enabled devices for polling
   */
  async findEnabledDevices(): Promise<Device[]> {
    try {
      const result = await db.query(`
        SELECT
          id, name, host, port, manufacturer, model,
          snmp_version as "snmpVersion",
          snmp_username as "snmpUsername",
          snmp_auth_protocol as "snmpAuthProtocol",
          snmp_auth_key as "snmpAuthKey",
          snmp_priv_protocol as "snmpPrivProtocol",
          snmp_priv_key as "snmpPrivKey",
          snmp_security_level as "snmpSecurityLevel",
          oid_profile as "oidProfile",
          oid_overrides as "oidOverrides",
          poll_interval_seconds as "pollIntervalSeconds",
          enabled,
          last_poll_at as "lastPollAt",
          last_poll_success as "lastPollSuccess",
          last_poll_error as "lastPollError",
          consecutive_failures as "consecutiveFailures",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM devices
        WHERE enabled = true
        ORDER BY name ASC
      `);
      return result.rows as Device[];
    } catch (error) {
      logger.error('Failed to fetch enabled devices', { error });
      throw new DatabaseError('Failed to fetch enabled devices');
    }
  }

  /**
   * Create new device
   */
  async create(input: DeviceCreateInput): Promise<Device> {
    try {
      const result = await db.query<Device>(`
        INSERT INTO devices (
          name, host, port, manufacturer, model,
          snmp_version, snmp_username, snmp_auth_protocol, snmp_auth_key,
          snmp_priv_protocol, snmp_priv_key, snmp_security_level,
          oid_profile, oid_overrides, poll_interval_seconds, enabled
        ) VALUES (
          $1, $2, $3, $4, $5, '3', $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        ) RETURNING *
      `, [
        input.name,
        input.host,
        input.port || 161,
        input.manufacturer,
        input.model,
        input.snmpUsername,
        input.snmpAuthProtocol,
        input.snmpAuthKey,
        input.snmpPrivProtocol,
        input.snmpPrivKey,
        input.snmpSecurityLevel || 'authPriv',
        input.oidProfile || 'apc-powernet',
        JSON.stringify(input.oidOverrides || {}),
        input.pollIntervalSeconds || 60,
        input.enabled !== undefined ? input.enabled : true,
      ]);

      logger.info('Device created', { deviceId: result.rows[0].id, name: input.name });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create device', { input, error });
      throw new DatabaseError('Failed to create device');
    }
  }

  /**
   * Update device
   */
  async update(id: number, input: DeviceUpdateInput): Promise<Device> {
    const device = await this.findById(id);
    if (!device) {
      throw new NotFoundError('Device', id);
    }

    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (input.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(input.name);
      }
      if (input.host !== undefined) {
        updates.push(`host = $${paramIndex++}`);
        values.push(input.host);
      }
      if (input.port !== undefined) {
        updates.push(`port = $${paramIndex++}`);
        values.push(input.port);
      }
      if (input.manufacturer !== undefined) {
        updates.push(`manufacturer = $${paramIndex++}`);
        values.push(input.manufacturer);
      }
      if (input.model !== undefined) {
        updates.push(`model = $${paramIndex++}`);
        values.push(input.model);
      }
      if (input.snmpUsername !== undefined) {
        updates.push(`snmp_username = $${paramIndex++}`);
        values.push(input.snmpUsername);
      }
      if (input.snmpAuthProtocol !== undefined) {
        updates.push(`snmp_auth_protocol = $${paramIndex++}`);
        values.push(input.snmpAuthProtocol);
      }
      if (input.snmpAuthKey !== undefined) {
        updates.push(`snmp_auth_key = $${paramIndex++}`);
        values.push(input.snmpAuthKey);
      }
      if (input.snmpPrivProtocol !== undefined) {
        updates.push(`snmp_priv_protocol = $${paramIndex++}`);
        values.push(input.snmpPrivProtocol);
      }
      if (input.snmpPrivKey !== undefined) {
        updates.push(`snmp_priv_key = $${paramIndex++}`);
        values.push(input.snmpPrivKey);
      }
      if (input.snmpSecurityLevel !== undefined) {
        updates.push(`snmp_security_level = $${paramIndex++}`);
        values.push(input.snmpSecurityLevel);
      }
      if (input.oidProfile !== undefined) {
        updates.push(`oid_profile = $${paramIndex++}`);
        values.push(input.oidProfile);
      }
      if (input.oidOverrides !== undefined) {
        updates.push(`oid_overrides = $${paramIndex++}`);
        values.push(JSON.stringify(input.oidOverrides));
      }
      if (input.pollIntervalSeconds !== undefined) {
        updates.push(`poll_interval_seconds = $${paramIndex++}`);
        values.push(input.pollIntervalSeconds);
      }
      if (input.enabled !== undefined) {
        updates.push(`enabled = $${paramIndex++}`);
        values.push(input.enabled);
      }

      if (updates.length === 0) {
        return device;
      }

      values.push(id);
      const result = await db.query<Device>(`
        UPDATE devices
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `, values);

      logger.info('Device updated', { deviceId: id });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to update device', { id, input, error });
      throw new DatabaseError('Failed to update device');
    }
  }

  /**
   * Delete device
   */
  async delete(id: number): Promise<void> {
    const device = await this.findById(id);
    if (!device) {
      throw new NotFoundError('Device', id);
    }

    try {
      await db.query(`DELETE FROM devices WHERE id = $1`, [id]);
      logger.info('Device deleted', { deviceId: id, name: device.name });
    } catch (error) {
      logger.error('Failed to delete device', { id, error });
      throw new DatabaseError('Failed to delete device');
    }
  }

  /**
   * Update poll status
   */
  async updatePollStatus(
    deviceId: number,
    success: boolean,
    error?: string
  ): Promise<void> {
    try {
      await db.query(`
        UPDATE devices
        SET
          last_poll_at = NOW(),
          last_poll_success = $1,
          last_poll_error = $2,
          consecutive_failures = CASE
            WHEN $1 = true THEN 0
            ELSE consecutive_failures + 1
          END
        WHERE id = $3
      `, [success, error || null, deviceId]);
    } catch (err) {
      logger.error('Failed to update poll status', { deviceId, error: err });
    }
  }

  /**
   * Get device statistics
   */
  async getStatistics() {
    try {
      const result = await db.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE enabled = true) as enabled,
          COUNT(*) FILTER (WHERE enabled = false) as disabled,
          COUNT(*) FILTER (WHERE enabled = true AND consecutive_failures < 3) as healthy,
          COUNT(*) FILTER (WHERE enabled = true AND consecutive_failures >= 3) as failing
        FROM devices
      `);
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get device statistics', { error });
      throw new DatabaseError('Failed to get device statistics');
    }
  }
}

export default new DeviceRepository();
