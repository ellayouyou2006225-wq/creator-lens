/**
 * CREATORLENS 2.0: DATA SCHEMA
 * Types for the coaching report workflow
 */

export type VideoPerformance = 'strong' | 'underperforming'

export interface RawMetrics {
  views: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  saves: number | null
  videoLengthSeconds: number | null
  avgWatchTimeSeconds: number | null
  completionRate: number | null
  newFollowers: number | null
}

export interface VideoInput {
  performance: VideoPerformance
  metrics: RawMetrics
  topic: string
  hook: string
  format: 'talking-head' | 'voiceover' | 'slideshow' | 'vlog' | 'screen-recording' | 'interview' | 'other'
  caption?: string
  cta?: string
}

export interface CoachingContext {
  strongVideo: VideoInput
  underperformingVideo: VideoInput
  primaryGoal: 'views' | 'followers' | 'engagement' | 'sales' | 'education'
  changesNoticed: string[]
  additionalContext?: string
}

/**
 * Derived metrics calculated from raw data
 */
export interface DerivedMetrics {
  likeRate: number
  commentRate: number
  shareRate: number
  saveRate: number
  engagementRate: number
  watchPercentage: number
  followerConversionRate: number
}

/**
 * Coaching report structure
 */
export interface CoachingReport {
  coachingSummary: string
  biggestDifference: {
    metric: string
    strongValue: number
    weakValue: number
    difference: number
    percentChange: number
    explanation: string
  }
  whatWorked: Strength[]
  likelyContributors: Contributor[]
  cannotConclude: string[]
  experiments: Experiment[]
  coachingBullets: string[]
}

export interface Strength {
  title: string
  evidence: string
  interpretation: string
  takeaway: string
}

export interface Contributor {
  title: string
  evidence: string
  explanation: string
  confidence: 'high' | 'medium' | 'exploratory'
}

export interface Experiment {
  title: string
  change: string
  keepConstant: string[]
  metricToWatch: string
  reason: string
  confidence: 'high' | 'medium' | 'exploratory'
  successSignal: string
}

/**
 * Application state
 */
export type AppScreen = 'landing' | 'input' | 'context' | 'questions' | 'loading' | 'report'

export interface AppState {
  screen: AppScreen
  strongVideo: VideoInput | null
  underperformingVideo: VideoInput | null
  context: Partial<CoachingContext>
  report: CoachingReport | null
  error: string | null
}
