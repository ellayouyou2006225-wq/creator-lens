'use client'

import { useState, useRef } from 'react'
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
  normalizeTopic,
  normalizeFormat,
  normalizeHook,
} from '@/app/lib/metrics'

const mockData = [
  { title: "Why I Quit My Job", views: 24500, likes: 1200, comments: 450, shares: 280, followers: 380, profileViews: 1250, avgWatchTime: 52, duration: 65, topic: "career", format: "personal story", hook: "personal confession", enjoyment: 5 },
  { title: "5 Resume Mistakes", views: 18300, likes: 720, comments: 220, shares: 95, followers: 95, profileViews: 580, avgWatchTime: 28, duration: 42, topic: "career", format: "list", hook: "question", enjoyment: 3 },
  { title: "Day in My Life - Recruiting", views: 32100, likes: 1480, comments: 620, shares: 310, followers: 520, profileViews: 1890, avgWatchTime: 58, duration: 48, topic: "recruiting", format: "personal story", hook: "personal confession", enjoyment: 5 },
  { title: "10 Productivity Tips", views: 15200, likes: 610, comments: 180, shares: 72, followers: 62, profileViews: 320, avgWatchTime: 22, duration: 38, topic: "productivity", format: "list", hook: "question", enjoyment: 2 },
  { title: "My Recruiting Story", views: 28900, likes: 1350, comments: 510, shares: 240, followers: 410, profileViews: 1520, avgWatchTime: 55, duration: 52, topic: "recruiting", format: "personal story", hook: "personal confession", enjoyment: 5 },
  { title: "Career Advice Q&A", views: 12100, likes: 480, comments: 140, shares: 48, followers: 45, profileViews: 240, avgWatchTime: 18, duration: 35, topic: "career", format: "q&a", hook: "question", enjoyment: 3 },
  { title: "First Day at New Job", views: 29300, likes: 1520, comments: 580, shares: 320, followers: 480, profileViews: 1680, avgWatchTime: 56, duration: 50, topic: "career", format: "personal story", hook: "personal confession", enjoyment: 5 },
  { title: "How to Network", views: 19800, likes: 820, comments: 310, shares: 140, followers: 180, profileViews: 850, avgWatchTime: 32, duration: 45, topic: "career", format: "tutorial", hook: "tip", enjoyment: 4 },
  { title: "Recruiting Fails", views: 35200, likes: 1680, comments: 720, shares: 410, followers: 620, profileViews: 2100, avgWatchTime: 60, duration: 58, topic: "recruiting", format: "personal story", hook: "controversial claim", enjoyment: 5 },
  { title: "Workspace Tour", views: 8900, likes: 310, comments: 85, shares: 35, followers: 38, profileViews: 290, avgWatchTime: 25, duration: 32, topic: "general", format: "vlog", hook: "teaser", enjoyment: 2 }
]

interface Video {
  title: string
  views: number
  likes: number
  comments: number
  shares: number
  followers: number
  profileViews: number
  avgWatchTime: number
  duration: number
  topic: string
  format: string
  hook: string
  enjoyment?: number
  [key: string]: any
}

interface Insight {
  finding: string
  evidence: string
  confidence: 'low' | 'moderate' | 'strong'
  caveat?: string
}

interface Recommendation {
  title: string
  spec: string
  why: string
  expected: string
  confounders: string[]
}

export default function Home() {
  const [screen, setScreen] = useState<'onboarding' | 'upload' | 'insights'>('onboarding')
  const [goal, setGoal] = useState<string | null>(null)
  const [creatorName, setCreatorName] = useState<string>('')
  const [videos, setVideos] = useState<Video[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const calculateInsights = (videoList: Video[], creatorGoal: string) => {
    // Calculate all metrics using corrected formulas
    const metrics = videoList.map(v => {
      const saves = 0 // Mock data doesn't have saves; default to 0
      const engagementMetric = calculateEngagementRate(v.likes, v.comments, v.shares, saves, v.views)
      const followerMetric = calculateFollowerConversionRate(v.followers, v.views)
      const profileMetric = calculateProfileVisitRate(v.profileViews, v.views)
      const shareMetric = calculateShareRate(v.shares, v.views)
      const commentMetric = calculateCommentRate(v.comments, v.views)
      const saveMetric = calculateSaveRate(saves, v.views)
      const watchPct = calculateWatchPercentage(v.avgWatchTime, v.duration)
      
      return {
        ...v,
        // Raw decimal forms (for calculations)
        engagementRateRaw: engagementMetric.raw,
        followerConversionRaw: followerMetric.raw,
        profileConversionRaw: profileMetric.raw,
        watchPercentageRaw: watchPct,
        shareRateRaw: shareMetric.raw,
        commentRateRaw: commentMetric.raw,
        saveRateRaw: saveMetric.raw,
        // Per-1,000 forms (for display)
        followerPer1000: followerMetric.perThousand,
        profilePer1000: profileMetric.perThousand,
        sharePer1000: shareMetric.perThousand,
        commentPer1000: commentMetric.perThousand,
        savePer1000: saveMetric.perThousand,
        engagementPer1000: engagementMetric.perThousand,
      }
    })

    const newInsights: Insight[] = []

    // Format Analysis
    const formats = [...new Set(videoList.map(v => normalizeFormat(v.format)))]
    const formatStats: Record<string, any> = {}
    
    formats.forEach(fmt => {
      const group = metrics.filter(v => normalizeFormat(v.format) === fmt)
      if (group.length >= 3) {
        const followerPer1000 = group.map(v => v.followerPer1000)
        formatStats[fmt] = {
          count: group.length,
          medianFollowerPer1000: median(followerPer1000),
          avgFollowerRaw: group.reduce((a, v) => a + v.followerConversionRaw, 0) / group.length,
          enjoyment: group.reduce((a, v) => a + (v.enjoyment || 3), 0) / group.length
        }
      }
    })

    // Compare personal story vs list if both exist
    if (formatStats['personal story'] && formatStats['list']) {
      const personCount = formatStats['personal story'].count
      const listCount = formatStats['list'].count
      
      // Confidence levels per spec: 3-5=low, 6-10=moderate, 10+=strong
      let confidence: 'low' | 'moderate' | 'strong' = 'low'
      if (personCount >= 10 && listCount >= 10) {
        confidence = 'strong'
      } else if (personCount >= 6 && listCount >= 6) {
        confidence = 'moderate'
      }
      
      const personMedian = formatStats['personal story'].medianFollowerPer1000
      const listMedian = formatStats['list'].medianFollowerPer1000
      
      if (listMedian > 0) {
        const multiplier = (personMedian / listMedian).toFixed(1)
        
        newInsights.push({
          finding: `Personal stories generated ${multiplier}x more followers per 1,000 views`,
          evidence: `Your ${personCount} personal-story videos had a median of ${Math.round(personMedian)} followers per 1,000 views. Your ${listCount} list videos had a median of ${Math.round(listMedian)} per 1,000 views.`,
          confidence,
          caveat: 'Your personal stories also tend to focus more on recruiting, so topic may explain part of this difference.'
        })
      }
    }

    // Topic Analysis
    const topics = [...new Set(videoList.map(v => normalizeTopic(v.topic)))]
    const topicStats: Record<string, any> = {}
    
    topics.forEach(topic => {
      const group = metrics.filter(v => normalizeTopic(v.topic) === topic)
      if (group.length >= 3) {
        const followerPer1000 = group.map(v => v.followerPer1000)
        const profilePer1000 = group.map(v => v.profilePer1000)
        topicStats[topic] = {
          count: group.length,
          medianFollowerPer1000: median(followerPer1000),
          medianProfilePer1000: median(profilePer1000),
          medianViews: median(group.map(v => v.views)),
          enjoyment: group.reduce((a, v) => a + (v.enjoyment || 3), 0) / group.length
        }
      }
    })

    // Compare recruiting vs career if both exist
    if (topicStats['recruiting'] && topicStats['career']) {
      const recruitCount = topicStats['recruiting'].count
      const careerCount = topicStats['career'].count
      
      // Confidence per spec
      let confidence: 'low' | 'moderate' | 'strong' = 'low'
      if (recruitCount >= 10 && careerCount >= 10) {
        confidence = 'strong'
      } else if (recruitCount >= 6 && careerCount >= 6) {
        confidence = 'moderate'
      }
      
      newInsights.push({
        finding: `Recruiting content was associated with higher follower conversion`,
        evidence: `Your ${recruitCount} recruiting videos had a median of ${Math.round(topicStats['recruiting'].medianFollowerPer1000)} followers per 1,000 views and ${Math.round(topicStats['recruiting'].medianProfilePer1000)} profile visits per 1,000 views. Your ${careerCount} career videos had a median of ${Math.round(topicStats['career'].medianFollowerPer1000)} followers and ${Math.round(topicStats['career'].medianProfilePer1000)} profile visits per 1,000 views.`,
        confidence,
        caveat: `Your recruiting videos averaged ${Math.round(topicStats['recruiting'].medianViews).toLocaleString()} views vs ${Math.round(topicStats['career'].medianViews).toLocaleString()} for career content. Video length, hook type, and posting time may also explain this difference.`
      })
    }

    // Hook Analysis (longer videos only)
    const longVideos = metrics.filter(v => v.duration > 45)
    if (longVideos.length >= 3) {
      const personalHooks = longVideos.filter(v => normalizeHook(v.hook) === 'personal confession')
      const questionHooks = longVideos.filter(v => normalizeHook(v.hook) === 'question')
      
      if (personalHooks.length >= 3 && questionHooks.length >= 3) {
        const personalWatch = personalHooks.map(v => v.watchPercentageRaw).reduce((a, v) => a + v, 0) / personalHooks.length
        const questionWatch = questionHooks.map(v => v.watchPercentageRaw).reduce((a, v) => a + v, 0) / questionHooks.length
        
        // Confidence per spec
        let confidence: 'low' | 'moderate' | 'strong' = 'low'
        if (personalHooks.length >= 10 && questionHooks.length >= 10) {
          confidence = 'strong'
        } else if (personalHooks.length >= 6 && questionHooks.length >= 6) {
          confidence = 'moderate'
        }
        
        if (personalWatch > questionWatch * 1.05) {
          newInsights.push({
            finding: `Personal confession hooks appeared to retain viewers longer in videos over 45 seconds`,
            evidence: `For videos >45 seconds: personal-confession hooks had a median watch percentage of ${(personalWatch * 100).toFixed(0)}% (${personalHooks.length} videos) vs ${(questionWatch * 100).toFixed(0)}% for question hooks (${questionHooks.length} videos).`,
            confidence,
            caveat: 'Recruiting videos heavily use personal confessions, so topic may be the primary driver of this pattern.'
          })
        }
      }
    }

    // Enjoyment Guard: Warn if best-performing format has low enjoyment
    if (Object.keys(formatStats).length > 0) {
      const maxPerformance = Math.max(...Object.values(formatStats).map((s: any) => s.medianFollowerPer1000 || 0))
      const lowEnjoymentFormats = Object.entries(formatStats).filter(
        ([fmt, stats]: any) => (stats.enjoyment || 3) < 3 && stats.medianFollowerPer1000 > maxPerformance * 0.8
      )
      
      if (lowEnjoymentFormats.length > 0) {
        const [fmt, stats] = lowEnjoymentFormats[0]
        newInsights.push({
          finding: `⚠️ Your highest-performing format (${fmt}) has low enjoyment`,
          evidence: `${fmt} videos had a median of ${Math.round((stats.medianFollowerPer1000 || 0))} followers per 1,000 views, but you rated them ${(stats.enjoyment || 3).toFixed(1)}/5 for enjoyment. Sustainable growth requires creating content you enjoy.`,
          confidence: 'strong',
          caveat: undefined
        })
      }
    }

    return newInsights.slice(0, 5)
  }

  const generateRecommendation = (videoList: Video[], creatorGoal: string): Recommendation | null => {
    // Use same corrected metrics as insights
    const saves = 0
    const metrics = videoList.map(v => {
      const engagementMetric = calculateEngagementRate(v.likes, v.comments, v.shares, saves, v.views)
      const followerMetric = calculateFollowerConversionRate(v.followers, v.views)
      const profileMetric = calculateProfileVisitRate(v.profileViews, v.views)
      
      return {
        ...v,
        followerPer1000: followerMetric.perThousand,
        profilePer1000: profileMetric.perThousand,
      }
    })

    const formats = [...new Set(videoList.map(v => normalizeFormat(v.format)))]
    const topics = [...new Set(videoList.map(v => normalizeTopic(v.topic)))]
    
    const formatStats: Record<string, any> = {}
    formats.forEach(fmt => {
      const group = metrics.filter(v => normalizeFormat(v.format) === fmt)
      if (group.length >= 3) {
        formatStats[fmt] = {
          count: group.length,
          medianFollowerPer1000: median(group.map(v => v.followerPer1000))
        }
      }
    })

    const topicStats: Record<string, any> = {}
    topics.forEach(topic => {
      const group = metrics.filter(v => normalizeTopic(v.topic) === topic)
      if (group.length >= 3) {
        topicStats[topic] = {
          count: group.length,
          medianFollowerPer1000: median(group.map(v => v.followerPer1000))
        }
      }
    })

    // Find best format (highest follower per 1000)
    let bestFormat = Object.entries(formatStats).reduce((best: any, [fmt, stats]: any) => 
      stats.medianFollowerPer1000 > (best?.medianFollowerPer1000 || 0) ? { fmt, ...stats } : best, null)

    // Find best topic (highest follower per 1000)
    let bestTopic = Object.entries(topicStats).reduce((best: any, [topic, stats]: any) =>
      stats.medianFollowerPer1000 > (best?.medianFollowerPer1000 || 0) ? { topic, ...stats } : best, null)

    if (!bestFormat || !bestTopic || bestFormat.count < 3 || bestTopic.count < 3) return null

    const confounders = []
    const videosInBest = metrics.filter(v => normalizeFormat(v.format) === bestFormat.fmt && normalizeTopic(v.topic) === bestTopic.topic)
    
    if (videosInBest.length > 0) {
      const durations = videosInBest.map(v => v.duration)
      if (Math.max(...durations) - Math.min(...durations) > 15) {
        confounders.push('video length varies significantly')
      }
      const medianViews = median(videosInBest.map(v => v.views))
      if (videosInBest.some(v => v.views > medianViews * 2.5)) {
        confounders.push('one viral outlier may inflate metrics')
      }
    }

    // Find best-performing hook for this format
    const hooksInFormat = metrics.filter(v => normalizeFormat(v.format) === bestFormat.fmt)
    const hookPerformance: Record<string, number[]> = {}
    hooksInFormat.forEach(v => {
      const normalizedHook = normalizeHook(v.hook)
      if (!hookPerformance[normalizedHook]) hookPerformance[normalizedHook] = []
      hookPerformance[normalizedHook].push(v.followerPer1000)
    })
    
    // Use best hook or default if insufficient data
    let bestHook = 'personal confession'
    let bestHookMedian = 0
    Object.entries(hookPerformance).forEach(([hook, values]) => {
      if (values.length >= 2) {
        const hookMedian = median(values)
        if (hookMedian > bestHookMedian) {
          bestHookMedian = hookMedian
          bestHook = hook
        }
      }
    })

    // Calculate historical benchmark for follower conversion
    const benchmarkVideos = videoList.filter(v => normalizeFormat(v.format) === bestFormat.fmt && normalizeTopic(v.topic) === bestTopic.topic)
    const benchmarkFollowerPer1000 = benchmarkVideos.length > 0 ? median(metrics.filter(v => normalizeFormat(v.format) === bestFormat.fmt && normalizeTopic(v.topic) === bestTopic.topic).map(v => v.followerPer1000)) : 0
    const benchmarkProfilePer1000 = benchmarkVideos.length > 0 ? median(metrics.filter(v => normalizeFormat(v.format) === bestFormat.fmt && normalizeTopic(v.topic) === bestTopic.topic).map(v => v.profilePer1000)) : 0

    return {
      title: `Test a ${bestTopic.topic} ${bestFormat.fmt} with a ${bestHook} hook`,
      spec: `Create a 40–55 second video about ${bestTopic.topic} in ${bestFormat.fmt} format using a ${bestHook} hook. Keep your posting time and CTA consistent.`,
      why: `Your ${bestFormat.fmt} videos have a median of ${Math.round(bestFormat.medianFollowerPer1000)} followers per 1,000 views, and ${bestTopic.topic} content appears to perform well with your audience.`,
      expected: `Historical benchmark: Similar videos in your dataset (${bestFormat.fmt} + ${bestTopic.topic}) generated a median of ${Math.round(benchmarkFollowerPer1000)} followers and ${Math.round(benchmarkProfilePer1000)} profile visits per 1,000 views. This is a reference point, not a forecast.`,
      confounders: confounders.length > 0 ? confounders : ['none identified']
    }
  }

  const handleLoadDemo = () => {
    const calculatedInsights = calculateInsights(mockData, goal || 'follower growth')
    const calculatedRec = generateRecommendation(mockData, goal || 'follower growth')
    setVideos(mockData)
    setInsights(calculatedInsights)
    setRecommendation(calculatedRec)
    setScreen('insights')
  }

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string
        const lines = csv.split('\n')
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        
        const parsed: Video[] = []
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue
          const values = lines[i].split(',').map(v => v.trim())
          const video: Video = { title: '', views: 0, likes: 0, comments: 0, shares: 0, followers: 0, profileViews: 0, avgWatchTime: 0, duration: 0, topic: '', format: '', hook: '' }
          
          headers.forEach((h, idx) => {
            const val = values[idx]
            if (h === 'title') video.title = val
            else if (h === 'views') video.views = parseInt(val) || 0
            else if (h === 'likes') video.likes = parseInt(val) || 0
            else if (h === 'comments') video.comments = parseInt(val) || 0
            else if (h === 'shares') video.shares = parseInt(val) || 0
            else if (h === 'followers') video.followers = parseInt(val) || 0
            else if (h === 'profileviews') video.profileViews = parseInt(val) || 0
            else if (h === 'avgwatchtime') video.avgWatchTime = parseInt(val) || 0
            else if (h === 'duration') video.duration = parseInt(val) || 0
            else if (h === 'topic') video.topic = val
            else if (h === 'format') video.format = val
            else if (h === 'hook') video.hook = val
            else if (h === 'enjoyment') video.enjoyment = parseInt(val) || 3
          })
          
          if (video.title && video.views > 0) parsed.push(video)
        }

        if (parsed.length < 3) {
          alert('Need at least 3 videos to analyze. CSV should have columns: title, views, likes, comments, shares, followers, profileViews, avgWatchTime, duration, topic, format, hook, enjoyment')
          return
        }

        const calculatedInsights = calculateInsights(parsed, goal || 'follower growth')
        const calculatedRec = generateRecommendation(parsed, goal || 'follower growth')
        setVideos(parsed)
        setInsights(calculatedInsights)
        setRecommendation(calculatedRec)
        setScreen('insights')
      } catch (err) {
        alert('Error parsing CSV. Make sure columns are: title, views, likes, comments, shares, followers, profileViews, avgWatchTime, duration, topic, format, hook, enjoyment')
      }
    }
    reader.readAsText(file)
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {screen === 'onboarding' && (
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-3">CreatorLens</h1>
            <p className="text-lg text-slate-600">Understand your video patterns. Make better content decisions.</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Your name (optional)</label>
              <input 
                type="text"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                placeholder="E.g., Ella"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-4">What's your primary goal?</label>
              <div className="space-y-3">
                {[
                  { value: 'reach', label: 'Reach', desc: 'Maximize views and impressions' },
                  { value: 'followers', label: 'Follower growth', desc: 'Build your audience' },
                  { value: 'engagement', label: 'Engagement', desc: 'More likes, comments, shares' },
                  { value: 'conversions', label: 'Conversions', desc: 'Clicks, signups, sales' }
                ].map(opt => (
                  <label key={opt.value} className="flex items-center p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                    <input 
                      type="radio" 
                      name="goal" 
                      value={opt.value}
                      onChange={(e) => setGoal(e.target.value)}
                      checked={goal === opt.value}
                      className="w-4 h-4"
                    />
                    <div className="ml-3">
                      <div className="font-medium text-slate-900">{opt.label}</div>
                      <div className="text-sm text-slate-500">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={() => goal && setScreen('upload')}
              disabled={!goal}
              className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next step →
            </button>
          </div>
        </div>
      )}

      {screen === 'upload' && (
        <div className="max-w-2xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Upload your video data</h1>
          <p className="text-lg text-slate-600 mb-8">Add 20–100 videos to analyze patterns. Start with demo data to see it in action.</p>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-8">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-teal-600 hover:bg-teal-50 transition"
              >
                <div className="text-4xl mb-3">📤</div>
                <p className="font-semibold text-slate-900 mb-1">Upload CSV</p>
                <p className="text-sm text-slate-600">Click to select or drag and drop</p>
              </div>
              <input 
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
              />

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-500 mb-4">— or —</p>
                <button
                  onClick={handleLoadDemo}
                  className="w-full bg-teal-600 text-white py-4 rounded-lg font-semibold hover:bg-teal-700 transition"
                >
                  Load demo data (10 sample videos)
                </button>
              </div>
            </div>

            <div className="bg-slate-100 rounded-lg p-4">
              <p className="text-sm font-semibold text-slate-900 mb-2">CSV Format</p>
              <p className="text-xs text-slate-600 font-mono">title, views, likes, comments, shares, followers, profileViews, avgWatchTime, duration, topic, format, hook, enjoyment</p>
              <p className="text-xs text-slate-600 mt-2">Example: "5 Tips Video", 10000, 500, 200, 100, 150, 250, 180, 30, "productivity", "list", "question", 4</p>
            </div>
          </div>
        </div>
      )}

      {screen === 'insights' && (
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Here's what's working{creatorName && `, ${creatorName}`}
            </h1>
            <p className="text-lg text-slate-600">Based on {videos.length} videos. Goal: {goal}</p>
          </div>

          {insights.length > 0 ? (
            <div className="space-y-4 mb-12">
              {insights.map((insight, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex justify-between items-start mb-3 gap-4">
                    <h3 className="font-semibold text-slate-900 text-lg leading-tight">{insight.finding}</h3>
                    <span className={`flex-shrink-0 text-xs font-semibold px-3 py-1 rounded whitespace-nowrap ${
                      insight.confidence === 'strong' ? 'bg-teal-100 text-teal-900' :
                      insight.confidence === 'moderate' ? 'bg-amber-100 text-amber-900' :
                      'bg-slate-100 text-slate-900'
                    }`}>
                      {insight.confidence}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{insight.evidence}</p>
                  {insight.caveat && (
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-3">
                      <p className="text-xs text-amber-900"><strong>⚠️ Caveat:</strong> {insight.caveat}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-100 rounded-lg p-6 mb-12 text-center">
              <p className="text-slate-600">Not enough data to generate insights yet. Try uploading 20+ videos.</p>
            </div>
          )}

          {recommendation && (
            <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 border border-teal-200 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Your next experiment</h2>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">{recommendation.title}</h3>
                <p className="text-sm text-slate-700 mb-4">{recommendation.why}</p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-1">YOUR SPEC</p>
                  <p className="text-sm text-slate-900 bg-white/60 p-3 rounded">{recommendation.spec}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-1">WHAT TO EXPECT</p>
                  <p className="text-sm text-slate-900 bg-white/60 p-3 rounded">{recommendation.expected}</p>
                </div>
                {recommendation.confounders[0] !== 'none identified' && (
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-1">⚠️ CONFOUNDING VARIABLES</p>
                    <p className="text-sm text-slate-900 bg-white/60 p-3 rounded">{recommendation.confounders.join(', ')}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setScreen('upload')
                  setInsights([])
                  setRecommendation(null)
                }}
                className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition"
              >
                Analyze another dataset
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
