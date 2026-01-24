import { BatteryEvent as BatteryEventType } from '../types/database.types';

export class BatteryEvent implements BatteryEventType {
  id: number;
  deviceId: number;

  // Event Timing
  eventStart: Date;
  eventEnd?: Date;
  durationSeconds?: number;

  // Battery State
  batteryCapacityStartPercent?: number;
  batteryCapacityEndPercent?: number;
  batteryCapacityDropPercent?: number;

  // Event Details
  triggerReason?: string;
  maxLoadPercent?: number;
  avgLoadPercent?: number;

  // Status
  eventCompleted: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;

  constructor(data: BatteryEventType) {
    this.id = data.id;
    this.deviceId = data.deviceId;

    this.eventStart = data.eventStart;
    this.eventEnd = data.eventEnd;
    this.durationSeconds = data.durationSeconds;

    this.batteryCapacityStartPercent = data.batteryCapacityStartPercent;
    this.batteryCapacityEndPercent = data.batteryCapacityEndPercent;
    this.batteryCapacityDropPercent = data.batteryCapacityDropPercent;

    this.triggerReason = data.triggerReason;
    this.maxLoadPercent = data.maxLoadPercent;
    this.avgLoadPercent = data.avgLoadPercent;

    this.eventCompleted = data.eventCompleted;

    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  isOngoing(): boolean {
    return !this.eventCompleted;
  }

  getDuration(): number | undefined {
    if (this.eventEnd) {
      return Math.floor((this.eventEnd.getTime() - this.eventStart.getTime()) / 1000);
    }
    return undefined;
  }
}
