/**
 * SAMPLE ANALYSIS DATA
 * Realistic example of strong vs. underperforming video
 */

import { VideoInput, CoachingContext } from './schema'

export const sampleStrongVideo: VideoInput = {
  performance: 'strong',
  metrics: {
    views: 24500,
    likes: 1200,
    comments: 450,
    shares: 280,
    saves: 320,
    videoLengthSeconds: 42,
    avgWatchTimeSeconds: 38,
    completionRate: 90,
    newFollowers: 380,
  },
  topic: 'Career transition',
  hook: 'I quit my job in tech after 5 years',
  format: 'talking-head',
  caption: "Sometimes the best career move is walking away. Here's why I did it and what I learned.",
  cta: 'Follow for more career insights',
}

export const sampleWeakVideo: VideoInput = {
  performance: 'underperforming',
  metrics: {
    views: 8200,
    likes: 280,
    comments: 92,
    shares: 35,
    saves: 48,
    videoLengthSeconds: 58,
    avgWatchTimeSeconds: 24,
    completionRate: 41,
    newFollowers: 52,
  },
  topic: 'Job search tips',
  hook: 'Today I want to share some helpful tips',
  format: 'talking-head',
  caption: 'Here are 5 tips for finding a new job',
  cta: 'Subscribe for more tips',
}

export const sampleContext: CoachingContext = {
  strongVideo: sampleStrongVideo,
  underperformingVideo: sampleWeakVideo,
  primaryGoal: 'followers',
  changesNoticed: ['Opening hook', 'Topic', 'Video length', 'CTA'],
  additionalContext: 'Both posted on Tuesday at 2pm',
}

/**
 * Summary of key differences for debugging
 */
export const sampleDifferences = {
  viewsMultiplier: 24500 / 8200, // 2.99x
  watchPercentageStrong: 38 / 42, // 90%
  watchPercentageWeak: 24 / 58, // 41%
  shareRateStrong: 280 / 24500, // 1.14%
  shareRateWeak: 35 / 8200, // 0.43%
  followerConversionStrong: 380 / 24500, // 1.55% / 15.5 per 1000
  followerConversionWeak: 52 / 8200, // 0.63% / 6.3 per 1000
}
