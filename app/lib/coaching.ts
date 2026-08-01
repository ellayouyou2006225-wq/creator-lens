/**
 * COACHING REPORT GENERATOR
 * Analyzes two videos and produces coaching insights
 */

import {
  VideoInput,
  DerivedMetrics,
  CoachingReport,
  Strength,
  Contributor,
  Experiment,
} from './schema'

/**
 * Calculate derived metrics from raw metrics
 */
export function calculateDerivedMetrics(video: VideoInput): DerivedMetrics {
  const m = video.metrics
  
  const views = m.views || 1 // Avoid division by zero
  const duration = m.videoLengthSeconds || 1
  
  return {
    likeRate: (m.likes || 0) / views,
    commentRate: (m.comments || 0) / views,
    shareRate: (m.shares || 0) / views,
    saveRate: (m.saves || 0) / views,
    engagementRate: ((m.likes || 0) + (m.comments || 0) + (m.shares || 0) + (m.saves || 0)) / views,
    watchPercentage: (m.avgWatchTimeSeconds || 0) / duration,
    followerConversionRate: (m.newFollowers || 0) / views,
  }
}

/**
 * Find the most meaningful metric difference
 */
interface MetricDifference {
  name: string
  metric: string
  strongValue: number
  weakValue: number
  difference: number
  percentChange: number
  importance: number
}

export function findBiggestDifference(
  strong: VideoInput,
  weak: VideoInput
): MetricDifference | null {
  const strongMetrics = calculateDerivedMetrics(strong)
  const weakMetrics = calculateDerivedMetrics(weak)
  
  const candidates: MetricDifference[] = []
  
  // Watch percentage difference
  if (strong.metrics.videoLengthSeconds && weak.metrics.videoLengthSeconds) {
    const diff = strongMetrics.watchPercentage - weakMetrics.watchPercentage
    if (Math.abs(diff) > 0.1) {
      candidates.push({
        name: 'Watch percentage',
        metric: `${(strongMetrics.watchPercentage * 100).toFixed(0)}% vs ${(weakMetrics.watchPercentage * 100).toFixed(0)}%`,
        strongValue: strongMetrics.watchPercentage,
        weakValue: weakMetrics.watchPercentage,
        difference: diff,
        percentChange: weakMetrics.watchPercentage > 0 ? diff / weakMetrics.watchPercentage : 999,
        importance: 10, // Retention is very important
      })
    }
  }
  
  // Share rate difference
  if ((weak.metrics.shares || 0) > 0) {
    const diff = strongMetrics.shareRate - weakMetrics.shareRate
    candidates.push({
      name: 'Share rate',
      metric: `${(strongMetrics.shareRate * 100).toFixed(2)}% vs ${(weakMetrics.shareRate * 100).toFixed(2)}%`,
      strongValue: strongMetrics.shareRate,
      weakValue: weakMetrics.shareRate,
      difference: diff,
      percentChange: diff / (weakMetrics.shareRate || 0.001),
      importance: 8,
    })
  }
  
  // Follower conversion difference
  if ((weak.metrics.newFollowers || 0) > 0) {
    const diff = strongMetrics.followerConversionRate - weakMetrics.followerConversionRate
    candidates.push({
      name: 'Follower conversion',
      metric: `${(strongMetrics.followerConversionRate * 100).toFixed(2)}% vs ${(weakMetrics.followerConversionRate * 100).toFixed(2)}%`,
      strongValue: strongMetrics.followerConversionRate,
      weakValue: weakMetrics.followerConversionRate,
      difference: diff,
      percentChange: diff / (weakMetrics.followerConversionRate || 0.001),
      importance: 8,
    })
  }
  
  // Engagement rate difference
  const engagementDiff = strongMetrics.engagementRate - weakMetrics.engagementRate
  if (engagementDiff > 0.001) {
    candidates.push({
      name: 'Engagement rate',
      metric: `${(strongMetrics.engagementRate * 100).toFixed(2)}% vs ${(weakMetrics.engagementRate * 100).toFixed(2)}%`,
      strongValue: strongMetrics.engagementRate,
      weakValue: weakMetrics.engagementRate,
      difference: engagementDiff,
      percentChange: engagementDiff / (weakMetrics.engagementRate || 0.001),
      importance: 7,
    })
  }
  
  if (candidates.length === 0) return null
  
  // Sort by importance and magnitude
  candidates.sort((a, b) => {
    const aScore = a.importance * Math.abs(a.percentChange)
    const bScore = b.importance * Math.abs(b.percentChange)
    return bScore - aScore
  })
  
  return candidates[0]
}

/**
 * Identify what worked in the strong video
 */
export function identifyStrengths(
  strong: VideoInput,
  weak: VideoInput,
  metrics: DerivedMetrics
): Strength[] {
  const strengths: Strength[] = []
  
  // Hook strength
  if (strong.hook && weak.hook && strong.hook !== weak.hook) {
    strengths.push({
      title: 'Personal opening',
      evidence: `You opened with "${strong.hook}", which held viewers through ${(metrics.watchPercentage * 100).toFixed(0)}% of the video.`,
      interpretation: 'Specific, personal openings make viewers feel invested immediately.',
      takeaway: 'Lead with a personal statement or specific story for your next video.',
    })
  }
  
  // Share rate
  if (metrics.shareRate > 0.005) {
    strengths.push({
      title: 'Shareable insights',
      evidence: `${(metrics.shareRate * 100).toFixed(2)}% of viewers shared this video, compared to ${((weak.metrics.shares || 0) / (weak.metrics.views || 1) * 100).toFixed(2)}% for the other.`,
      interpretation: 'Viewers found something worth sending to others.',
      takeaway: 'Focus on utility or emotional resonance in your next video.',
    })
  }
  
  // Topic
  if (strong.topic && weak.topic && strong.topic !== weak.topic) {
    strengths.push({
      title: `"${strong.topic}" resonates with your audience`,
      evidence: `This video reached ${strong.metrics.views?.toLocaleString()} views with a ${(metrics.followerConversionRate * 100).toFixed(2)}% follower conversion rate.`,
      interpretation: 'Your audience is engaged with this topic.',
      takeaway: `Plan your next 3–5 videos around ${strong.topic}.`,
    })
  }
  
  return strengths.slice(0, 3)
}

/**
 * Identify what may have held the weak video back
 */
export function identifyContributors(
  strong: VideoInput,
  weak: VideoInput
): Contributor[] {
  const contributors: Contributor[] = []
  const strongMetrics = calculateDerivedMetrics(strong)
  const weakMetrics = calculateDerivedMetrics(weak)
  
  // Hook difference
  if (strong.hook && weak.hook && strong.hook !== weak.hook) {
    contributors.push({
      title: 'Opening may not have grabbed attention',
      evidence: `Your opening was "${weak.hook}". Viewers watched only ${(weakMetrics.watchPercentage * 100).toFixed(0)}% compared to ${(strongMetrics.watchPercentage * 100).toFixed(0)}% for the other video.`,
      explanation: 'A vague or delayed hook loses viewers in the first few seconds.',
      confidence: 'high',
    })
  }
  
  // Length difference
  if (strong.metrics.videoLengthSeconds && weak.metrics.videoLengthSeconds) {
    const lengthDiff = weak.metrics.videoLengthSeconds - strong.metrics.videoLengthSeconds
    if (lengthDiff > 10) {
      contributors.push({
        title: 'Video may have been too long',
        evidence: `This video was ${weak.metrics.videoLengthSeconds}s, vs ${strong.metrics.videoLengthSeconds}s for the stronger video. Watch percentage was ${(weakMetrics.watchPercentage * 100).toFixed(0)}%.`,
        explanation: 'Longer videos need tighter editing and stronger hooks to retain attention.',
        confidence: 'medium',
      })
    }
  }
  
  // Topic difference
  if (strong.topic && weak.topic && strong.topic !== weak.topic) {
    contributors.push({
      title: `"${weak.topic}" may be less engaging`,
      evidence: `This video generated ${weak.metrics.views} views and ${(weakMetrics.followerConversionRate * 100).toFixed(2)}% follower conversion, vs ${(strongMetrics.followerConversionRate * 100).toFixed(2)}% for "${strong.topic}".`,
      explanation: 'Your audience may be more interested in different topics.',
      confidence: 'medium',
    })
  }
  
  // CTA difference
  if (strong.cta && weak.cta && strong.cta !== weak.cta) {
    contributors.push({
      title: 'Call-to-action may not have resonated',
      evidence: `This video used "${weak.cta}", but the other used "${strong.cta}".`,
      explanation: 'Different CTAs can influence whether viewers follow or engage.',
      confidence: 'exploratory',
    })
  }
  
  return contributors.slice(0, 3)
}

/**
 * Identify confounding variables
 */
export function identifyConfounders(strong: VideoInput, weak: VideoInput): string[] {
  const confounders: string[] = []
  
  // Multiple differences
  let differenceCount = 0
  if (strong.hook !== weak.hook) differenceCount++
  if (strong.topic !== weak.topic) differenceCount++
  if (strong.format !== weak.format) differenceCount++
  if (strong.metrics.videoLengthSeconds !== weak.metrics.videoLengthSeconds) differenceCount++
  if (strong.cta !== weak.cta) differenceCount++
  
  if (differenceCount > 2) {
    confounders.push('You changed multiple elements between videos, so we cannot isolate which one made the difference.')
  }
  
  // Missing data
  if (!weak.metrics.avgWatchTimeSeconds) {
    confounders.push('The underperforming video is missing watch-time data, which limits our analysis.')
  }
  
  // Missing creative info
  if (!weak.hook || !weak.topic) {
    confounders.push('Some creative context is missing, which may affect our analysis.')
  }
  
  return confounders
}

/**
 * Generate recommended video structure for next week
 */
export function generateNextWeekPlan(
  strong: VideoInput,
  weak: VideoInput,
  goal: string,
  experiments: Experiment[]
): any {
  const strongMetrics = calculateDerivedMetrics(strong)
  const weakMetrics = calculateDerivedMetrics(weak)

  // Select the primary experiment to build on
  const primaryExperiment = experiments[0]

  // Construct the next week plan
  const videoIdea = `Create a ${strong.topic} video in ${strong.format} format using the ${primaryExperiment?.change || 'improved hook'} approach that worked in your strongest video.`

  const hook = strong.hook || primaryExperiment?.change || "I discovered something most people get wrong about this..."

  // Create structure based on video length
  const duration = strong.metrics.videoLengthSeconds || 45
  const structure = []

  if (duration <= 30) {
    structure.push(
      { timeRange: '0–3 sec', instruction: `Hook: "${hook}"` },
      { timeRange: '3–15 sec', instruction: 'Explain the core insight or problem' },
      { timeRange: '15–25 sec', instruction: 'Show the solution or lesson' },
      { timeRange: '25–30 sec', instruction: 'Call to action' }
    )
  } else if (duration <= 60) {
    structure.push(
      { timeRange: '0–3 sec', instruction: `Hook: "${hook}"` },
      { timeRange: '3–15 sec', instruction: 'Set up the context or story' },
      { timeRange: '15–35 sec', instruction: 'Develop the idea with specific examples' },
      { timeRange: '35–50 sec', instruction: 'Reveal the insight or lesson' },
      { timeRange: '50–60 sec', instruction: 'Strong CTA' }
    )
  } else {
    structure.push(
      { timeRange: '0–5 sec', instruction: `Hook: "${hook}"` },
      { timeRange: '5–20 sec', instruction: 'Establish credibility or context' },
      { timeRange: '20–50 sec', instruction: 'Tell the story or develop the idea' },
      { timeRange: '50–75 sec', instruction: 'Deliver the key insight' },
      { timeRange: '75–90 sec', instruction: 'CTA and close' }
    )
  }

  const cta = strong.cta || 'Follow for more insights'

  const watchDiff = ((strongMetrics.watchPercentage - weakMetrics.watchPercentage) * 100).toFixed(0)
  const whyThisTest = `Your strongest video used this hook and format, achieving ${(strongMetrics.watchPercentage * 100).toFixed(0)}% watch rate vs ${(weakMetrics.watchPercentage * 100).toFixed(0)}% for your weaker one. This test isolates the hook change while keeping topic and format consistent.`

  const metricToWatch = primaryExperiment?.metricToWatch || 'Watch percentage'

  return {
    videoIdea,
    hook,
    structure,
    cta,
    whyThisTest,
    metricToWatch,
  }
}

/**
 * Select most important performance metrics to compare visually
 */
export function selectPerformanceMetrics(
  strong: VideoInput,
  weak: VideoInput
): any[] {
  const strongMetrics = calculateDerivedMetrics(strong)
  const weakMetrics = calculateDerivedMetrics(weak)

  const candidates = []

  // Watch percentage (most important)
  if (strong.metrics.videoLengthSeconds && weak.metrics.videoLengthSeconds) {
    candidates.push({
      name: 'Watch percentage',
      strongValue: strongMetrics.watchPercentage * 100,
      weakValue: weakMetrics.watchPercentage * 100,
      unit: '%',
      isPercentage: true,
      importance: 10,
    })
  }

  // Engagement rate
  if ((weak.metrics.likes || 0) + (weak.metrics.comments || 0) + (weak.metrics.shares || 0) > 0) {
    candidates.push({
      name: 'Engagement rate',
      strongValue: strongMetrics.engagementRate * 100,
      weakValue: weakMetrics.engagementRate * 100,
      unit: '%',
      isPercentage: true,
      importance: 9,
    })
  }

  // Share rate
  if ((weak.metrics.shares || 0) > 0) {
    candidates.push({
      name: 'Share rate',
      strongValue: strongMetrics.shareRate * 100,
      weakValue: weakMetrics.shareRate * 100,
      unit: '%',
      isPercentage: true,
      importance: 8,
    })
  }

  // Follower conversion
  if ((weak.metrics.newFollowers || 0) > 0) {
    candidates.push({
      name: 'Follower conversion',
      strongValue: strongMetrics.followerConversionRate * 100,
      weakValue: weakMetrics.followerConversionRate * 100,
      unit: '%',
      isPercentage: true,
      importance: 8,
    })
  }

  // Average watch time
  if (strong.metrics.avgWatchTimeSeconds && weak.metrics.avgWatchTimeSeconds) {
    candidates.push({
      name: 'Average watch time',
      strongValue: strong.metrics.avgWatchTimeSeconds,
      weakValue: weak.metrics.avgWatchTimeSeconds,
      unit: 'sec',
      isPercentage: false,
      importance: 7,
    })
  }

  // Sort by importance and select top 3-4
  candidates.sort((a, b) => b.importance - a.importance)
  return candidates.slice(0, 4)
}

/**
 * Generate three specific experiments
 */
export function generateExperiments(
  strong: VideoInput,
  weak: VideoInput,
  goal: string,
  differences: string[]
): Experiment[] {
  const strongMetrics = calculateDerivedMetrics(strong)
  const weakMetrics = calculateDerivedMetrics(weak)
  
  const experiments: Experiment[] = []
  
  // Experiment 1: Hook (if it differs)
  if (strong.hook && weak.hook && strong.hook !== weak.hook) {
    experiments.push({
      title: `Test a "${strong.hook}" hook`,
      change: `Open with: "${strong.hook}"`,
      keepConstant: [strong.topic, `${strong.metrics.videoLengthSeconds}s length`, strong.format],
      metricToWatch: 'Watch percentage',
      reason: `Your "${strong.hook}" hook kept viewers through ${(strongMetrics.watchPercentage * 100).toFixed(0)}% of the video, while "${weak.hook}" only kept them through ${(weakMetrics.watchPercentage * 100).toFixed(0)}%.`,
      confidence: 'high',
      successSignal: `Achieve at least ${(strongMetrics.watchPercentage * 100).toFixed(0)}% watch percentage.`,
    })
  }
  
  // Experiment 2: Length (if it differs)
  if (strong.metrics.videoLengthSeconds && weak.metrics.videoLengthSeconds) {
    const diff = weak.metrics.videoLengthSeconds - strong.metrics.videoLengthSeconds
    if (Math.abs(diff) > 8) {
      const action = diff > 0 ? `Shorten to ${strong.metrics.videoLengthSeconds}s` : `Expand to ${strong.metrics.videoLengthSeconds}s`
      experiments.push({
        title: `Adjust video length`,
        change: action,
        keepConstant: [strong.topic, strong.hook, strong.format],
        metricToWatch: 'Watch percentage & shares',
        reason: `The shorter video (${strong.metrics.videoLengthSeconds}s) had a ${(strongMetrics.watchPercentage * 100).toFixed(0)}% watch rate and ${(strongMetrics.shareRate * 100).toFixed(2)}% share rate.`,
        confidence: 'high',
        successSignal: `Match or exceed the ${(strongMetrics.shareRate * 100).toFixed(2)}% share rate.`,
      })
    }
  }
  
  // Experiment 3: Topic (if it differs)
  if (strong.topic && weak.topic && strong.topic !== weak.topic) {
    experiments.push({
      title: `Create content about ${strong.topic}`,
      change: `Topic: ${strong.topic}`,
      keepConstant: [strong.format, strong.hook, `${strong.metrics.videoLengthSeconds}s`],
      metricToWatch: 'Followers gained',
      reason: `"${strong.topic}" videos generate ${(strongMetrics.followerConversionRate * 100).toFixed(2)}% follower conversion, vs ${(weakMetrics.followerConversionRate * 100).toFixed(2)}% for "${weak.topic}".`,
      confidence: 'medium',
      successSignal: `Achieve ${strong.metrics.newFollowers} followers per ${(strong.metrics.views || 10000).toLocaleString()} views.`,
    })
  }
  
  // If we don't have 3 experiments yet, add a general refinement
  if (experiments.length < 3) {
    experiments.push({
      title: 'Refine your editing pace',
      change: `Tighten cuts to every 2–3 seconds (faster pacing)`,
      keepConstant: [strong.topic, strong.hook, strong.format],
      metricToWatch: 'Watch percentage',
      reason: 'Faster editing typically improves retention.',
      confidence: 'medium',
      successSignal: 'Maintain at least 80% watch percentage.',
    })
  }
  
  return experiments.slice(0, 3)
}

/**
 * Generate coaching summary
 */
export function generateCoachingSummary(
  strong: VideoInput,
  weak: VideoInput,
  biggestDiff: MetricDifference | null
): string {
  if (!biggestDiff) {
    return 'The videos have similar metrics. The difference likely comes from how you promoted them or when you posted.'
  }
  
  if (biggestDiff.name.includes('Watch')) {
    return `The strongest difference was retention: your successful video kept viewers much longer, giving TikTok stronger signals to amplify it.`
  }
  
  if (biggestDiff.name.includes('Share')) {
    return `The strongest difference was shareability: your successful video generated ${(biggestDiff.percentChange * 100).toFixed(0)}% more shares, meaning viewers wanted to send it to others.`
  }
  
  if (biggestDiff.name.includes('Follower')) {
    return `The strongest difference was audience fit: your successful video converted viewers to followers at nearly ${biggestDiff.percentChange.toFixed(1)}x the rate.`
  }
  
  return 'Your successful video outperformed on multiple metrics. The biggest difference was likely how it kept viewers engaged.'
}
