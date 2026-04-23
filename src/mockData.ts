/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReelLog } from './types';

export const MOCK_REELS: ReelLog[] = [
  ...Array.from({ length: 150 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(i / 10)); // spread over 15 days
    date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
    
    const platforms: any[] = ['Instagram', 'TikTok', 'YouTube Shorts'];
    const topics = ['Cooking', 'Tech', 'Comedy', 'Fitness', 'Travel', 'ASMR'];
    const creators = ['@chef_max', '@tech_guy', '@funny_gal', '@fit_king', '@travel_explorer'];

    return {
      id: `reel-${i}`,
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      durationSeconds: Math.floor(Math.random() * 60) + 15,
      timestamp: date,
      topic: topics[Math.floor(Math.random() * topics.length)],
      creator: creators[Math.floor(Math.random() * creators.length)]
    };
  })
];
