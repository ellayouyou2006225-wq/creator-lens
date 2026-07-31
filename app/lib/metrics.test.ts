/**
 * PHASE 2: TESTING AND VERIFICATION
 * 
 * Explicit tests for all metric formulas.
 * Validates unit conversions, edge cases, and hard requirements.
 */

import {
  calculateEngagementRate,
  calculateFollowerConversionRate,
  calculateProfileVisitRate,
  calculateShareRate,
  calculateCommentRate,
  calculateSaveRate,
  calculateWatchPercentage,
  formatMetric,
  median,
  detectOutliers,
} from './metrics'

/**
 * TEST 1: Follower Conversion Rate (1.60% = 16 per 1,000 views)
 * 
 * Example: 380 followers / 24,500 views
 * = 0.01551 (raw)
 * = 1.551% (percentage)
 * = 15.51 per 1,000 views (per-1,000)
 */
describe('calculateFollowerConversionRate', () => {
  test('converts 380 followers from 24,500 views to correct units', () => {
    const result = calculateFollowerConversionRate(380, 24500)
    
    // Raw: 380 / 24500 = 0.01551...
    expect(result.raw).toBeCloseTo(0.01551, 4)
    
    // Percentage: 0.01551 * 100 = 1.551%
    expect(result.percentage).toBeCloseTo(1.551, 2)
    
    // Per-1,000: 0.01551 * 1000 = 15.51
    expect(result.perThousand).toBeCloseTo(15.51, 1)
  })

  test('converts 1.60% to 16 per 1,000 views exactly', () => {
    // Working backward: 16 per 1,000 = 0.016 raw
    // So: followers / views = 0.016
    // If views = 10,000: followers = 160
    const result = calculateFollowerConversionRate(160, 10000)
    
    expect(result.raw).toBeCloseTo(0.016, 3)
    expect(result.percentage).toBeCloseTo(1.6, 1)
    expect(result.perThousand).toBeCloseTo(16, 0)
  })

  test('handles zero views without producing Infinity', () => {
    const result = calculateFollowerConversionRate(100, 0)
    
    expect(result.raw).toBe(0)
    expect(result.percentage).toBe(0)
    expect(result.perThousand).toBe(0)
    expect(isFinite(result.raw)).toBe(true)
  })
})

/**
 * TEST 2: Profile Visit Rate (5.70% = 57 per 1,000 views)
 * 
 * Example: 1,250 profile views / 24,500 views
 * = 0.0510 (raw)
 * = 5.10% (percentage)
 * = 51.0 per 1,000 views
 */
describe('calculateProfileVisitRate', () => {
  test('converts 1,250 profile views from 24,500 views correctly', () => {
    const result = calculateProfileVisitRate(1250, 24500)
    
    expect(result.raw).toBeCloseTo(0.0510, 3)
    expect(result.percentage).toBeCloseTo(5.10, 1)
    expect(result.perThousand).toBeCloseTo(51.0, 0)
  })

  test('converts 5.70% to 57 per 1,000 views exactly', () => {
    // 57 per 1,000 = 0.057 raw
    // If views = 10,000: profileViews = 570
    const result = calculateProfileVisitRate(570, 10000)
    
    expect(result.raw).toBeCloseTo(0.057, 3)
    expect(result.percentage).toBeCloseTo(5.7, 1)
    expect(result.perThousand).toBeCloseTo(57, 0)
  })

  test('handles zero views without producing Infinity', () => {
    const result = calculateProfileVisitRate(500, 0)
    
    expect(result.raw).toBe(0)
    expect(isFinite(result.raw)).toBe(true)
  })
})

/**
 * TEST 3: Engagement Rate (includes saves)
 * 
 * Formula: (likes + comments + shares + saves) / views
 * 
 * Example from mock data:
 * "Why I Quit My Job": 1,200 likes + 450 comments + 280 shares + 0 saves = 1,930
 * 1,930 / 24,500 views = 0.0788 = 7.88%
 */
describe('calculateEngagementRate', () => {
  test('calculates engagement including all four components', () => {
    // Mock video: "Why I Quit My Job"
    const result = calculateEngagementRate(1200, 450, 280, 0, 24500)
    
    // (1200 + 450 + 280 + 0) / 24500 = 1930 / 24500 = 0.0788
    expect(result.raw).toBeCloseTo(0.0788, 3)
    expect(result.percentage).toBeCloseTo(7.88, 1)
    expect(result.perThousand).toBeCloseTo(78.8, 0)
  })

  test('includes saves when calculating engagement', () => {
    // Same video but with 100 saves
    const resultWithSaves = calculateEngagementRate(1200, 450, 280, 100, 24500)
    
    // (1200 + 450 + 280 + 100) / 24500 = 2030 / 24500 = 0.0829
    expect(resultWithSaves.raw).toBeCloseTo(0.0829, 3)
    expect(resultWithSaves.percentage).toBeCloseTo(8.29, 1)
  })

  test('handles zero views without producing NaN', () => {
    const result = calculateEngagementRate(100, 50, 20, 10, 0)
    
    expect(result.raw).toBe(0)
    expect(isFinite(result.raw)).toBe(true)
  })
})

/**
 * TEST 4: Share Rate
 * 
 * Formula: shares / views
 */
describe('calculateShareRate', () => {
  test('calculates share rate correctly', () => {
    // "Why I Quit My Job": 280 shares / 24,500 views
    const result = calculateShareRate(280, 24500)
    
    expect(result.raw).toBeCloseTo(0.01143, 4)
    expect(result.percentage).toBeCloseTo(1.143, 2)
    expect(result.perThousand).toBeCloseTo(11.43, 1)
  })

  test('handles zero views without producing Infinity', () => {
    const result = calculateShareRate(100, 0)
    
    expect(result.raw).toBe(0)
    expect(isFinite(result.raw)).toBe(true)
  })
})

/**
 * TEST 5: Comment Rate
 * 
 * Formula: comments / views
 */
describe('calculateCommentRate', () => {
  test('calculates comment rate correctly', () => {
    // "Why I Quit My Job": 450 comments / 24,500 views
    const result = calculateCommentRate(450, 24500)
    
    expect(result.raw).toBeCloseTo(0.01837, 4)
    expect(result.percentage).toBeCloseTo(1.837, 2)
    expect(result.perThousand).toBeCloseTo(18.37, 1)
  })
})

/**
 * TEST 6: Save Rate
 * 
 * Formula: saves / views
 */
describe('calculateSaveRate', () => {
  test('calculates save rate correctly', () => {
    const result = calculateSaveRate(500, 25000)
    
    expect(result.raw).toBe(0.02)
    expect(result.percentage).toBe(2.0)
    expect(result.perThousand).toBe(20)
  })

  test('handles zero views without producing Infinity', () => {
    const result = calculateSaveRate(100, 0)
    
    expect(result.raw).toBe(0)
    expect(isFinite(result.raw)).toBe(true)
  })
})

/**
 * TEST 7: Watch Percentage
 * 
 * Formula: (avgWatchTimeSeconds / durationSeconds) * 100
 * Result should be 0-100 (percentage), capped at 100
 */
describe('calculateWatchPercentage', () => {
  test('calculates watch percentage correctly', () => {
    // "Why I Quit My Job": 52 seconds watched / 65 seconds duration
    // = 0.8 = 80%
    const result = calculateWatchPercentage(52, 65)
    
    expect(result).toBeCloseTo(80, 1)
  })

  test('caps watch percentage at 100%', () => {
    // If somehow avgWatchTime > duration
    const result = calculateWatchPercentage(70, 65)
    
    expect(result).toBeLessThanOrEqual(100)
  })

  test('handles zero duration without producing Infinity', () => {
    const result = calculateWatchPercentage(50, 0)
    
    expect(result).toBe(0)
    expect(isFinite(result)).toBe(true)
  })
})

/**
 * TEST 8: Format Metric for Display
 * 
 * Ensures proper string representation of metrics
 */
describe('formatMetric', () => {
  test('formats metric as percentage', () => {
    const metric = calculateFollowerConversionRate(160, 10000)
    const formatted = formatMetric(metric, 'percentage', 2)
    
    expect(formatted).toBe('1.60%')
  })

  test('formats metric as per-1,000 without decimals', () => {
    const metric = calculateFollowerConversionRate(160, 10000)
    const formatted = formatMetric(metric, 'perThousand', 0)
    
    expect(formatted).toBe('16')
  })

  test('formats metric as raw decimal', () => {
    const metric = calculateFollowerConversionRate(160, 10000)
    const formatted = formatMetric(metric, 'raw', 3)
    
    expect(formatted).toBe('0.016')
  })
})

/**
 * TEST 9: Median Calculation
 */
describe('median', () => {
  test('calculates median of odd-length array', () => {
    const values = [1, 2, 3, 4, 5]
    expect(median(values)).toBe(3)
  })

  test('calculates median of even-length array', () => {
    const values = [1, 2, 3, 4]
    expect(median(values)).toBe(2.5)
  })

  test('handles empty array', () => {
    expect(median([])).toBe(0)
  })
})

/**
 * TEST 10: Outlier Detection
 * 
 * Detects values > 2 standard deviations from mean
 */
describe('detectOutliers', () => {
  test('detects viral outlier in view counts', () => {
    // Normal videos: 10k, 12k, 11k, 13k, 11.5k views
    // Viral video: 500k views (extreme outlier > 2 std devs)
    const values = [10000, 12000, 11000, 13000, 11500, 500000]
    const outliers = detectOutliers(values)
    
    // Should detect the 500k as outlier (index 5)
    expect(outliers).toContain(5)
    expect(outliers.length).toBeGreaterThanOrEqual(1)
  })

  test('returns empty array if no outliers', () => {
    const values = [10, 11, 12, 13, 14]
    const outliers = detectOutliers(values)
    
    expect(outliers).toEqual([])
  })

  test('handles arrays with fewer than 3 elements', () => {
    expect(detectOutliers([1, 2])).toEqual([])
  })
})

// Summary: All tests passing means:
// ✅ 1.60% correctly converts to 16 per 1,000
// ✅ 5.70% correctly converts to 57 per 1,000
// ✅ Saves included in engagement calculation
// ✅ Zero views don't produce NaN/Infinity
// ✅ All rates correctly normalized
// ✅ Watch percentage capped at 100%
