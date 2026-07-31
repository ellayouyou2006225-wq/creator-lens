/**
 * PHASE 2: MATHEMATICAL ACCURACY
 * 
 * All formulas are deterministic. No AI performs arithmetic.
 * All values traceable to input data. No hard-coded numbers.
 */

export interface MetricResult {
  raw: number // Decimal form (0.016)
  percentage: number // Percentage form (1.6)
  perThousand: number // Per-1,000 form (16)
}

/**
 * Safely divide two numbers.
 * Returns 0 if denominator is 0 to prevent NaN/Infinity.
 */
function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  if (!isFinite(numerator) || !isFinite(denominator)) return 0
  return numerator / denominator
}

/**
 * Calculate engagement rate.
 * Formula: (likes + comments + shares + saves) / views
 * @returns MetricResult with raw, percentage, and per-1,000 forms
 */
export function calculateEngagementRate(
  likes: number,
  comments: number,
  shares: number,
  saves: number,
  views: number
): MetricResult {
  const numerator = likes + comments + shares + saves
  const raw = safeDivide(numerator, views)
  
  return {
    raw,
    percentage: raw * 100,
    perThousand: raw * 1000
  }
}

/**
 * Calculate follower conversion rate.
 * Formula: newFollowers / views
 */
export function calculateFollowerConversionRate(
  followers: number,
  views: number
): MetricResult {
  const raw = safeDivide(followers, views)
  
  return {
    raw,
    percentage: raw * 100,
    perThousand: raw * 1000
  }
}

/**
 * Calculate profile visit rate.
 * Formula: profileViews / views
 */
export function calculateProfileVisitRate(
  profileViews: number,
  views: number
): MetricResult {
  const raw = safeDivide(profileViews, views)
  
  return {
    raw,
    percentage: raw * 100,
    perThousand: raw * 1000
  }
}

/**
 * Calculate share rate.
 * Formula: shares / views
 */
export function calculateShareRate(
  shares: number,
  views: number
): MetricResult {
  const raw = safeDivide(shares, views)
  
  return {
    raw,
    percentage: raw * 100,
    perThousand: raw * 1000
  }
}

/**
 * Calculate comment rate.
 * Formula: comments / views
 */
export function calculateCommentRate(
  comments: number,
  views: number
): MetricResult {
  const raw = safeDivide(comments, views)
  
  return {
    raw,
    percentage: raw * 100,
    perThousand: raw * 1000
  }
}

/**
 * Calculate save rate.
 * Formula: saves / views
 */
export function calculateSaveRate(
  saves: number,
  views: number
): MetricResult {
  const raw = safeDivide(saves, views)
  
  return {
    raw,
    percentage: raw * 100,
    perThousand: raw * 1000
  }
}

/**
 * Calculate watch percentage.
 * Formula: (avgWatchTimeSeconds / durationSeconds) * 100
 * Returns as 0-100 percentage (not 0-1 decimal)
 */
export function calculateWatchPercentage(
  avgWatchTimeSeconds: number,
  durationSeconds: number
): number {
  if (durationSeconds === 0) return 0
  if (!isFinite(avgWatchTimeSeconds) || !isFinite(durationSeconds)) return 0
  
  const raw = safeDivide(avgWatchTimeSeconds, durationSeconds)
  // Return as percentage (0-100) not decimal (0-1)
  return Math.min(raw * 100, 100) // Cap at 100%
}

/**
 * Format a MetricResult for display.
 * 
 * Usage examples:
 * - formatMetric(followerRate, 'perThousand') → "16 followers"
 * - formatMetric(followerRate, 'percentage') → "1.60%"
 */
export function formatMetric(
  metric: MetricResult,
  format: 'raw' | 'percentage' | 'perThousand',
  decimals: number = 2
): string {
  switch (format) {
    case 'raw':
      return metric.raw.toFixed(decimals)
    case 'percentage':
      return `${metric.percentage.toFixed(decimals)}%`
    case 'perThousand':
      return metric.perThousand.toFixed(0)
    default:
      return '0'
  }
}

/**
 * Normalize categorical values (topic, format, hook).
 * Handles common variations.
 */
export function normalizeTopic(topic: string): string {
  if (!topic) return 'uncategorized'
  const lower = topic.trim().toLowerCase()
  
  const mapping: Record<string, string> = {
    'recruitment': 'recruiting',
    'recruiting': 'recruiting',
    'job': 'career',
    'career': 'career',
    'jobs': 'career',
  }
  
  return mapping[lower] || lower
}

export function normalizeFormat(format: string): string {
  if (!format) return 'uncategorized'
  const lower = format.trim().toLowerCase()
  
  const mapping: Record<string, string> = {
    'storytime': 'personal story',
    'story': 'personal story',
    'personal story': 'personal story',
    'list': 'list',
    'listicle': 'list',
    'q&a': 'q&a',
    'qna': 'q&a',
    'question': 'q&a',
    'tutorial': 'tutorial',
    'how-to': 'tutorial',
    'vlog': 'vlog',
    'vlogging': 'vlog',
  }
  
  return mapping[lower] || lower
}

export function normalizeHook(hook: string): string {
  if (!hook) return 'uncategorized'
  const lower = hook.trim().toLowerCase()
  
  const mapping: Record<string, string> = {
    'personal confession': 'personal confession',
    'confession': 'personal confession',
    'question': 'question',
    'question hook': 'question',
    'tip': 'tip',
    'controversial': 'controversial claim',
    'controversial claim': 'controversial claim',
    'teaser': 'teaser',
  }
  
  return mapping[lower] || lower
}

/**
 * Detect outliers in a set of values.
 * Returns indices of values > 2 standard deviations from mean.
 */
export function detectOutliers(values: number[]): number[] {
  if (values.length < 3) return []
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)
  
  if (stdDev === 0) return []
  
  return values
    .map((val, idx) => ({ val, idx }))
    .filter(({ val }) => Math.abs(val - mean) > 2 * stdDev)
    .map(({ idx }) => idx)
}

/**
 * Calculate median of a set of numbers.
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}
