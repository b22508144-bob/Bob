/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Platform = 'Instagram' | 'TikTok' | 'YouTube Shorts' | 'Facebook';

export interface ReelLog {
  id: string;
  platform: Platform;
  durationSeconds: number;
  timestamp: Date;
  topic: string;
  creator: string;
}

export interface ConsumptionStats {
  dailyTotal: number;
  weeklyTotal: number;
  avgReelsPerDay: number;
  platformBreakdown: Record<Platform, number>;
  peakHours: Record<number, number>; // hour -> count
  streaks: number;
}
