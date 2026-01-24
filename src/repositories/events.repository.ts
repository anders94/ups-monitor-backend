import db from '../config/database';
import { BatteryEvent } from '../types/database.types';
import { DatabaseError } from '../utils/errors';
import logger from '../config/logger';

export class EventsRepository {
  /**
   * Create new battery event
   */
  async createBatteryEvent(
    deviceId: number,
    eventStart: Date,
    batteryCapacityStartPercent?: number
  ): Promise<BatteryEvent> {
    try {
      const result = await db.query<any>(`
        INSERT INTO battery_events (
          device_id, event_start, battery_capacity_start_percent, event_completed
        ) VALUES ($1, $2, $3, false)
        RETURNING
          id,
          device_id as "deviceId",
          event_start as "eventStart",
          event_end as "eventEnd",
          duration_seconds as "durationSeconds",
          battery_capacity_start_percent as "batteryCapacityStartPercent",
          battery_capacity_end_percent as "batteryCapacityEndPercent",
          battery_capacity_drop_percent as "batteryCapacityDropPercent",
          trigger_reason as "triggerReason",
          max_load_percent as "maxLoadPercent",
          avg_load_percent as "avgLoadPercent",
          event_completed as "eventCompleted",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `, [deviceId, eventStart, batteryCapacityStartPercent]);

      logger.info('Battery event started', { deviceId, eventId: result.rows[0].id });
      return result.rows[0] as BatteryEvent;
    } catch (error) {
      logger.error('Failed to create battery event', { deviceId, error });
      throw new DatabaseError('Failed to create battery event');
    }
  }

  /**
   * Get ongoing (incomplete) battery event for device
   */
  async getOngoingEvent(deviceId: number): Promise<BatteryEvent | null> {
    try {
      const result = await db.query<any>(`
        SELECT
          id,
          device_id as "deviceId",
          event_start as "eventStart",
          event_end as "eventEnd",
          duration_seconds as "durationSeconds",
          battery_capacity_start_percent as "batteryCapacityStartPercent",
          battery_capacity_end_percent as "batteryCapacityEndPercent",
          battery_capacity_drop_percent as "batteryCapacityDropPercent",
          trigger_reason as "triggerReason",
          max_load_percent as "maxLoadPercent",
          avg_load_percent as "avgLoadPercent",
          event_completed as "eventCompleted",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM battery_events
        WHERE device_id = $1 AND event_completed = false
        ORDER BY event_start DESC
        LIMIT 1
      `, [deviceId]);

      return (result.rows[0] as BatteryEvent) || null;
    } catch (error) {
      logger.error('Failed to get ongoing event', { deviceId, error });
      throw new DatabaseError('Failed to get ongoing event');
    }
  }

  /**
   * Complete battery event
   */
  async completeBatteryEvent(
    eventId: number,
    eventEnd: Date,
    batteryCapacityEndPercent?: number,
    maxLoadPercent?: number,
    avgLoadPercent?: number
  ): Promise<BatteryEvent> {
    try {
      const result = await db.query<any>(`
        UPDATE battery_events
        SET
          event_end = $1,
          duration_seconds = EXTRACT(EPOCH FROM ($1 - event_start))::INTEGER,
          battery_capacity_end_percent = $2,
          battery_capacity_drop_percent = CASE
            WHEN battery_capacity_start_percent IS NOT NULL AND $2 IS NOT NULL
            THEN battery_capacity_start_percent - $2
            ELSE NULL
          END,
          max_load_percent = $3,
          avg_load_percent = $4,
          event_completed = true
        WHERE id = $5
        RETURNING
          id,
          device_id as "deviceId",
          event_start as "eventStart",
          event_end as "eventEnd",
          duration_seconds as "durationSeconds",
          battery_capacity_start_percent as "batteryCapacityStartPercent",
          battery_capacity_end_percent as "batteryCapacityEndPercent",
          battery_capacity_drop_percent as "batteryCapacityDropPercent",
          trigger_reason as "triggerReason",
          max_load_percent as "maxLoadPercent",
          avg_load_percent as "avgLoadPercent",
          event_completed as "eventCompleted",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `, [eventEnd, batteryCapacityEndPercent, maxLoadPercent, avgLoadPercent, eventId]);

      logger.info('Battery event completed', { eventId });
      return result.rows[0] as BatteryEvent;
    } catch (error) {
      logger.error('Failed to complete battery event', { eventId, error });
      throw new DatabaseError('Failed to complete battery event');
    }
  }

  /**
   * Get battery events in time range
   */
  async getBatteryEvents(
    deviceId: number,
    start: Date,
    end: Date,
    limit: number = 100
  ): Promise<BatteryEvent[]> {
    try {
      const result = await db.query<any>(`
        SELECT
          id,
          device_id as "deviceId",
          event_start as "eventStart",
          event_end as "eventEnd",
          duration_seconds as "durationSeconds",
          battery_capacity_start_percent as "batteryCapacityStartPercent",
          battery_capacity_end_percent as "batteryCapacityEndPercent",
          battery_capacity_drop_percent as "batteryCapacityDropPercent",
          trigger_reason as "triggerReason",
          max_load_percent as "maxLoadPercent",
          avg_load_percent as "avgLoadPercent",
          event_completed as "eventCompleted",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM battery_events
        WHERE device_id = $1
          AND event_start >= $2
          AND event_start <= $3
        ORDER BY event_start DESC
        LIMIT $4
      `, [deviceId, start, end, limit]);

      return result.rows as BatteryEvent[];
    } catch (error) {
      logger.error('Failed to get battery events', { deviceId, start, end, error });
      throw new DatabaseError('Failed to get battery events');
    }
  }

  /**
   * Get battery events for multiple devices
   */
  async getMultiDeviceBatteryEvents(
    deviceIds: number[],
    start: Date,
    end: Date,
    limit: number = 100
  ): Promise<BatteryEvent[]> {
    try {
      const result = await db.query<any>(`
        SELECT
          id,
          device_id as "deviceId",
          event_start as "eventStart",
          event_end as "eventEnd",
          duration_seconds as "durationSeconds",
          battery_capacity_start_percent as "batteryCapacityStartPercent",
          battery_capacity_end_percent as "batteryCapacityEndPercent",
          battery_capacity_drop_percent as "batteryCapacityDropPercent",
          trigger_reason as "triggerReason",
          max_load_percent as "maxLoadPercent",
          avg_load_percent as "avgLoadPercent",
          event_completed as "eventCompleted",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM battery_events
        WHERE device_id = ANY($1)
          AND event_start >= $2
          AND event_start <= $3
        ORDER BY event_start DESC
        LIMIT $4
      `, [deviceIds, start, end, limit]);

      return result.rows as BatteryEvent[];
    } catch (error) {
      logger.error('Failed to get multi-device battery events', { deviceIds, start, end, error });
      throw new DatabaseError('Failed to get multi-device battery events');
    }
  }

  /**
   * Delete old battery events
   */
  async deleteOldBatteryEvents(olderThan: Date): Promise<number> {
    try {
      const result = await db.query(`
        DELETE FROM battery_events
        WHERE event_start < $1
      `, [olderThan]);

      return result.rowCount || 0;
    } catch (error) {
      logger.error('Failed to delete old battery events', { olderThan, error });
      throw new DatabaseError('Failed to delete old battery events');
    }
  }

  /**
   * Count battery events in time range
   */
  async countBatteryEvents(
    deviceId: number,
    start: Date,
    end: Date
  ): Promise<number> {
    try {
      const result = await db.query(`
        SELECT COUNT(*) as count
        FROM battery_events
        WHERE device_id = $1
          AND event_start >= $2
          AND event_start <= $3
          AND event_completed = true
      `, [deviceId, start, end]);

      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Failed to count battery events', { deviceId, start, end, error });
      throw new DatabaseError('Failed to count battery events');
    }
  }
}

export default new EventsRepository();
