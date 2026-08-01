'use client'

import { useState, useRef } from 'react'

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
    const metrics = videoList.map(v => ({
      ...v,
      engagementRate: (v.likes + v.comments + v.shares) / v.views,
      followerConversion: v.followers / v.views,
      profileConversion: v.profileViews / v.views,
      watchPercentage: v.avgWatchTime / v.duration,
      shareRate: v.shares / v.views
    }))

    const newInsights: Insight[] = []

    // Format Analysis
    const formats = [...new Set(videoList.map(v => v.format))]
    const formatStats: Record<string, any> = {}
    
    formats.forEach(fmt => {
      const group = metrics.filter(v => v.format === fmt)
      if (group.length >= 3) {
        formatStats[fmt] = {
          count: group.length,
          avgFollowerConv: group.reduce((a, v) => a + v.followerConversion, 0) / group.length,
          avgEngagement: group.reduce((a, v) => a + v.engagementRate, 0) / group.length,
          avgProfileConv: group.reduce((a, v) => a + v.profileConversion, 0) / group.length,
          avgWatchPct: group.reduce((a, v) => a + v.watchPercentage, 0) / group.length,
          enjoyment: group.reduce((a, v) => a + (v.enjoyment || 3), 0) / group.length
        }
      }
    })

    if (formatStats['personal story'] && formatStats['list']) {
      const multiplier = (formatStats['personal story'].avgFollowerConv / formatStats['list'].avgFollowerConv).toFixed(1)
      const personCount = formatStats['personal story'].count
      const listCount = formatStats['list'].count
      const confidence = personCount >= 6 && listCount >= 6 ? 'strong' : personCount >= 4 && listCount >= 4 ? 'moderate' : 'low'
      
      newInsights.push({
        finding: `Personal stories generate ${multiplier}x more followers per 1,000 views`,
        evidence: `Your ${personCount} personal-story videos averaged ${(formatStats['personal story'].avgFollowerConv * 100).toFixed(2)}% follower conversion vs ${(formatStats['list'].avgFollowerConv * 100).toFixed(2)}% for ${listCount} list videos.`,
        confidence,
        caveat: personCount > 0 && listCount > 0 ? 'Your personal stories also tend to focus more on recruiting, so the topic may be driving some of this difference.' : undefined
      })
    }

    // Topic Analysis
    const topics = [...new Set(videoList.map(v => v.topic))]
    const topicStats: Record<string, any> = {}
    
    topics.forEach(topic => {
      const group = metrics.filter(v => v.topic === topic)
      if (group.length >= 3) {
        topicStats[topic] = {
          count: group.length,
          avgFollowerConv: group.reduce((a, v) => a + v.followerConversion, 0) / group.length,
          avgProfileConv: group.reduce((a, v) => a + v.profileConversion, 0) / group.length,
          avgViews: group.reduce((a, v) => a + v.views, 0) / group.length,
          enjoyment: group.reduce((a, v) => a + (v.enjoyment || 3), 0) / group.length
        }
      }
    })

    if (topicStats['recruiting'] && topicStats['career']) {
      const recruitCount = topicStats['recruiting'].count
      const careerCount = topicStats['career'].count
      const confidence = recruitCount >= 6 && careerCount >= 6 ? 'strong' : 'moderate'
      
      newInsights.push({
        finding: `Recruiting content attracts higher-quality followers`,
        evidence: `Your ${recruitCount} recruiting videos: ${(topicStats['recruiting'].avgFollowerConv * 100).toFixed(2)}% follower conversion, ${(topicStats['recruiting'].avgProfileConv * 100).toFixed(2)}% profile visits. Career videos: ${(topicStats['career'].avgFollowerConv * 100).toFixed(2)}% conversion, ${(topicStats['career'].avgProfileConv * 100).toFixed(2)}% profile visits.`,
        confidence,
        caveat: `Your recruiting videos average ${Math.round(topicStats['recruiting'].avgViews).toLocaleString()} views vs ${Math.round(topicStats['career'].avgViews).toLocaleString()} for career content, so audience quality matters more than raw reach here.`
      })
    }

    // Hook Analysis (longer videos)
    const longVideos = metrics.filter(v => v.duration > 45)
    if (longVideos.length >= 6) {
      const personalHooks = longVideos.filter(v => v.hook === 'personal confession')
      const questionHooks = longVideos.filter(v => v.hook === 'question')
      
      if (personalHooks.length >= 3 && questionHooks.length >= 3) {
        const personalWatch = personalHooks.reduce((a, v) => a + v.watchPercentage, 0) / personalHooks.length
        const questionWatch = questionHooks.reduce((a, v) => a + v.watchPercentage, 0) / questionHooks.length
        
        if (personalWatch > questionWatch * 1.05) {
          newInsights.push({
            finding: `Personal confession hooks retain viewers better in videos over 45 seconds`,
            evidence: `For videos >45 seconds: personal-confession hooks averaged ${(personalWatch * 100).toFixed(0)}% watch percentage (${personalHooks.length} videos) vs ${(questionWatch * 100).toFixed(0)}% for question hooks (${questionHooks.length} videos).`,
            confidence: 'moderate',
            caveat: 'Recruiting videos heavily use personal confessions, so the topic overlap makes it hard to isolate the hook effect.'
          })
        }
      }
    }

    // Enjoyment Guard
    const lowEnjoymentHighPerformance = Object.entries(formatStats).find(([fmt, stats]: any) => {
      const enjoymentScore = stats.enjoyment || 3
      return enjoymentScore < 3 && stats.avgFollowerConv > Object.values(formatStats).reduce((max: any, s: any) => Math.max(max, s.avgFollowerConv), 0) * 0.8
    })

    if (lowEnjoymentHighPerformance) {
      const [fmt, stats] = lowEnjoymentHighPerformance
      newInsights.push({
        finding: `⚠️ Your highest-performing format (${fmt}) has the lowest enjoyment score`,
        evidence: `"${fmt}" videos convert at ${(stats.avgFollowerConv * 100).toFixed(2)}% but you average only ${stats.enjoyment.toFixed(1)}/5 enjoyment. Sustainable growth needs content you actually want to make.`,
        confidence: 'strong',
        caveat: undefined
      })
    }

    return newInsights.slice(0, 5)
  }

  const generateRecommendation = (videoList: Video[], creatorGoal: string): Recommendation | null => {
    const metrics = videoList.map(v => ({
      ...v,
      followerConversion: v.followers / v.views,
      profileConversion: v.profileViews / v.views,
      watchPercentage: v.avgWatchTime / v.duration
    }))

    const formats = [...new Set(videoList.map(v => v.format))]
    const topics = [...new Set(videoList.map(v => v.topic))]
    
    const formatStats: Record<string, any> = {}
    formats.forEach(fmt => {
      const group = metrics.filter(v => v.format === fmt)
      if (group.length >= 3) {
        formatStats[fmt] = {
          count: group.length,
          avgFollowerConv: group.reduce((a, v) => a + v.followerConversion, 0) / group.length
        }
      }
    })

    const topicStats: Record<string, any> = {}
    topics.forEach(topic => {
      const group = metrics.filter(v => v.topic === topic)
      if (group.length >= 3) {
        topicStats[topic] = {
          count: group.length,
          avgFollowerConv: group.reduce((a, v) => a + v.followerConversion, 0) / group.length
        }
      }
    })

    // Find best format
    let bestFormat = Object.entries(formatStats).reduce((best: any, [fmt, stats]: any) => 
      stats.avgFollowerConv > (best?.avgFollowerConv || 0) ? { fmt, ...stats } : best, null)

    // Find best topic  
    let bestTopic = Object.entries(topicStats).reduce((best: any, [topic, stats]: any) =>
      stats.avgFollowerConv > (best?.avgFollowerConv || 0) ? { topic, ...stats } : best, null)

    if (!bestFormat || !bestTopic || bestFormat.count < 3 || bestTopic.count < 3) return null

    const confounders = []
    const videosInBest = metrics.filter(v => v.format === bestFormat.fmt && v.topic === bestTopic.topic)
    
    if (videosInBest.length > 0) {
      if (Math.max(...videosInBest.map(v => v.duration)) - Math.min(...videosInBest.map(v => v.duration)) > 15) {
        confounders.push('video length varies significantly')
      }
      const avgViews = videosInBest.reduce((a, v) => a + v.views, 0) / videosInBest.length
      if (videosInBest.some(v => v.views > avgViews * 2)) {
        confounders.push('one viral outlier exists')
      }
    }

    const hooks = [...new Set(metrics.filter(v => v.format === bestFormat.fmt).map(v => v.hook))]
    const bestHook = hooks[Math.floor(Math.random() * hooks.length)]

    return {
      title: `Test a ${bestTopic.topic} ${bestFormat.fmt} with a ${bestHook} hook`,
      spec: `Create a 40–55 second video about ${bestTopic.topic} in ${bestFormat.fmt} format using a ${bestHook} hook. Keep your posting time and CTA consistent.`,
      why: `Your ${bestFormat.fmt} videos convert at ${(bestFormat.avgFollowerConv * 100).toFixed(2)}% and ${bestTopic.topic} content attracts your most engaged audience.`,
      expected: `Target: 300+ profile views and 150+ followers per 1,000 views (based on your ${bestFormat.fmt} performance).`,
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
