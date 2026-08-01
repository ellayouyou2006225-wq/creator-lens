'use client'

import { useState } from 'react'
import {
  VideoInput,
  RawMetrics,
  CoachingContext,
  AppScreen,
  AppState,
} from './lib/schema'
import {
  findBiggestDifference,
  identifyStrengths,
  identifyContributors,
  identifyConfounders,
  generateExperiments,
  generateCoachingSummary,
  calculateDerivedMetrics,
  generateNextWeekPlan,
  selectPerformanceMetrics,
} from './lib/coaching'
import { sampleContext } from './lib/demo'

const colors = {
  bg: '#0f0f0f',
  surface: '#1a1a1a',
  border: '#2a2a2a',
  textPrimary: '#f5f1e8',
  textSecondary: '#a89f94',
  textTertiary: '#6b6359',
  lime: '#7ee22c',
  limeDark: '#5fa61f',
  orange: '#b8855c',
  violet: '#8b7fb8',
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>({
    screen: 'landing',
    strongVideo: null,
    underperformingVideo: null,
    context: {},
    report: null,
    error: null,
  })

  const handleStartAnalysis = () => {
    setAppState(prev => ({ ...prev, screen: 'input', error: null }))
  }

  const handleTryDemo = () => {
    const report = generateCoachingReport(sampleContext)
    setAppState(prev => ({
      ...prev,
      screen: 'report',
      strongVideo: sampleContext.strongVideo,
      underperformingVideo: sampleContext.underperformingVideo,
      context: sampleContext,
      report,
    }))
  }

  const handleVideoInputComplete = (strong: VideoInput, weak: VideoInput) => {
    setAppState(prev => ({
      ...prev,
      screen: 'context',
      strongVideo: strong,
      underperformingVideo: weak,
    }))
  }

  const handleContextComplete = (context: Partial<CoachingContext>) => {
    setAppState(prev => ({
      ...prev,
      screen: 'questions',
      strongVideo: context.strongVideo || prev.strongVideo,
      underperformingVideo: context.underperformingVideo || prev.underperformingVideo,
      context: { ...prev.context, ...context },
    }))
  }

  const handleAnalyze = (goal: string, changes: string[], additionalContext?: string) => {
    const fullContext: CoachingContext = {
      strongVideo: appState.strongVideo!,
      underperformingVideo: appState.underperformingVideo!,
      primaryGoal: goal as any,
      changesNoticed: changes,
      additionalContext,
    }

    const report = generateCoachingReport(fullContext)

    setAppState(prev => ({
      ...prev,
      screen: 'report',
      context: fullContext,
      report,
    }))
  }

  const handleStartOver = () => {
    setAppState({
      screen: 'landing',
      strongVideo: null,
      underperformingVideo: null,
      context: {},
      report: null,
      error: null,
    })
  }

  return (
    <div style={{ backgroundColor: colors.bg, color: colors.textPrimary, minHeight: '100vh' }}>
      {appState.screen === 'landing' && (
        <LandingScreen onStartAnalysis={handleStartAnalysis} onTryDemo={handleTryDemo} />
      )}

      {appState.screen === 'input' && (
        <VideoInputScreen onComplete={handleVideoInputComplete} />
      )}

      {appState.screen === 'context' && appState.strongVideo && appState.underperformingVideo && (
        <ContextScreen
          strongVideo={appState.strongVideo}
          weakVideo={appState.underperformingVideo}
          onComplete={handleContextComplete}
        />
      )}

      {appState.screen === 'questions' && (
        <QuestionsScreen onAnalyze={handleAnalyze} />
      )}

      {appState.screen === 'report' && appState.report && (
        <ReportScreen
          report={appState.report}
          strongVideo={appState.strongVideo!}
          weakVideo={appState.underperformingVideo!}
          onStartOver={handleStartOver}
        />
      )}
    </div>
  )
}

// ===== LANDING SCREEN =====

function LandingScreen({ onStartAnalysis, onTryDemo }: any) {
  return (
    <div style={{ backgroundColor: colors.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ borderBottom: `1px solid ${colors.border}` }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-light tracking-tight">CreatorLens</h1>
          <div className="text-xs" style={{ color: colors.textTertiary }}>v1</div>
        </div>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-12">
            <p className="text-sm font-medium mb-4" style={{ color: colors.lime }}>Your post-performance content coach</p>
            <h2 className="text-5xl md:text-6xl font-light leading-tight mb-8 max-w-3xl" style={{ color: colors.textPrimary }}>
              Turn your analytics into your next creative decision.
            </h2>
            <p className="text-lg max-w-2xl mb-16 leading-relaxed" style={{ color: colors.textSecondary }}>
              Compare one strong video with one that underperformed. See what likely made the difference and what to test next.
            </p>
          </div>

          {/* Process */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              { num: '1', label: 'Upload analytics', desc: 'Screenshot or manual entry' },
              { num: '2', label: 'Compare what changed', desc: 'See the metrics that matter' },
              { num: '3', label: 'Know what to post', desc: 'Get exact next steps' },
            ].map(step => (
              <div key={step.num} className="group">
                <div className="text-4xl font-light mb-3 opacity-60 group-hover:opacity-100 transition-opacity" style={{ color: colors.lime }}>{step.num}</div>
                <h4 className="font-medium mb-2" style={{ color: colors.textPrimary }}>{step.label}</h4>
                <p className="text-sm" style={{ color: colors.textTertiary }}>{step.desc}</p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button
              onClick={onStartAnalysis}
              className="px-8 py-3 rounded-full font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: colors.lime, color: colors.bg }}
            >
              Analyze my videos
            </button>
            <button
              onClick={onTryDemo}
              className="px-8 py-3 rounded-full font-semibold transition-all hover:opacity-90"
              style={{ border: `1px solid ${colors.textSecondary}`, color: colors.textPrimary }}
            >
              Try a sample analysis
            </button>
          </div>

          <p className="text-xs" style={{ color: colors.textTertiary }}>
            No account required. Your data is processed only for this analysis.
          </p>
        </div>
      </div>
    </div>
  )
}

// ===== VIDEO INPUT SCREEN =====

function VideoInputScreen({ onComplete }: any) {
  const [strongMetrics, setStrongMetrics] = useState<RawMetrics>({
    views: null,
    likes: null,
    comments: null,
    shares: null,
    saves: null,
    videoLengthSeconds: null,
    avgWatchTimeSeconds: null,
    completionRate: null,
    newFollowers: null,
  })

  const [weakMetrics, setWeakMetrics] = useState<RawMetrics>({
    views: null,
    likes: null,
    comments: null,
    shares: null,
    saves: null,
    videoLengthSeconds: null,
    avgWatchTimeSeconds: null,
    completionRate: null,
    newFollowers: null,
  })

  const [strongHook, setStrongHook] = useState('')
  const [weakHook, setWeakHook] = useState('')
  const [extractingStrong, setExtractingStrong] = useState(false)
  const [extractingWeak, setExtractingWeak] = useState(false)
  const [errorStrong, setErrorStrong] = useState<string | null>(null)
  const [errorWeak, setErrorWeak] = useState<string | null>(null)

  const handleScreenshotUpload = async (file: File, isStrong: boolean) => {
    const setExtracting = isStrong ? setExtractingStrong : setExtractingWeak
    const setError = isStrong ? setErrorStrong : setErrorWeak
    const setMetrics = isStrong ? setStrongMetrics : setWeakMetrics

    setExtracting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('screenshot', file)

      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Extraction failed')
        setExtracting(false)
        return
      }

      setMetrics({
        views: data.metrics.views.value,
        likes: data.metrics.likes.value,
        comments: data.metrics.comments.value,
        shares: data.metrics.shares.value,
        saves: data.metrics.saves.value,
        videoLengthSeconds: data.metrics.videoLengthSeconds.value,
        avgWatchTimeSeconds: data.metrics.averageWatchTimeSeconds.value,
        completionRate: data.metrics.completionRate.value,
        newFollowers: data.metrics.newFollowers.value,
      })

      if (data.warnings && data.warnings.length > 0) {
        setError(`Extracted, but: ${data.warnings.join(', ')}. Edit below as needed.`)
      }
    } catch (err) {
      setError('Upload failed. Try manual entry.')
    } finally {
      setExtracting(false)
    }
  }

  const handleContinue = () => {
    if (!strongMetrics.views || !weakMetrics.views) {
      alert('Enter views for both videos')
      return
    }
    if (!strongHook || !weakHook) {
      alert('Enter opening hooks for both videos')
      return
    }

    onComplete(
      {
        performance: 'strong',
        metrics: strongMetrics,
        topic: '',
        hook: strongHook,
        format: 'talking-head',
      },
      {
        performance: 'underperforming',
        metrics: weakMetrics,
        topic: '',
        hook: weakHook,
        format: 'talking-head',
      }
    )
  }

  return (
    <div style={{ backgroundColor: colors.bg, minHeight: '100vh' }}>
      <header style={{ borderBottom: `1px solid ${colors.border}`, position: 'sticky', top: 0 }}>
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between py-4">
          <h1 className="text-xl font-light">Enter your videos</h1>
          <button onClick={handleContinue} className="text-sm py-2 px-6 rounded-full font-semibold transition-all hover:opacity-90" style={{ backgroundColor: colors.lime, color: colors.bg }}>
            Continue
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-16">
          {/* Strong Video */}
          <div className="animate-slide-up">
            <div className="mb-8">
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-xl" style={{ color: colors.lime }}>✓</span>
                <h2 className="text-2xl font-light">Strong video</h2>
              </div>
              <p className="text-sm" style={{ color: colors.textSecondary }}>One that performed better than expected</p>
            </div>

            <div className="space-y-4">
              <ScreenshotUpload
                onUpload={file => handleScreenshotUpload(file, true)}
                isExtracting={extractingStrong}
                error={errorStrong}
                onClearError={() => setErrorStrong(null)}
              />

              <MetricsForm
                metrics={strongMetrics}
                onChange={setStrongMetrics}
              />

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Opening hook (first 3 seconds)</label>
                <textarea
                  value={strongHook}
                  onChange={e => setStrongHook(e.target.value)}
                  placeholder="e.g., I quit my tech job after 5 years"
                  className="w-full px-4 py-3 rounded text-sm border"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Weak Video */}
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="mb-8">
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-xl" style={{ color: colors.orange }}>—</span>
                <h2 className="text-2xl font-light">Underperforming video</h2>
              </div>
              <p className="text-sm" style={{ color: colors.textSecondary }}>One that performed worse than expected</p>
            </div>

            <div className="space-y-4">
              <ScreenshotUpload
                onUpload={file => handleScreenshotUpload(file, false)}
                isExtracting={extractingWeak}
                error={errorWeak}
                onClearError={() => setErrorWeak(null)}
              />

              <MetricsForm
                metrics={weakMetrics}
                onChange={setWeakMetrics}
              />

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Opening hook (first 3 seconds)</label>
                <textarea
                  value={weakHook}
                  onChange={e => setWeakHook(e.target.value)}
                  placeholder="e.g., Today I want to share some helpful tips"
                  className="w-full px-4 py-3 rounded text-sm border"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t mt-16 pt-8 flex gap-4 justify-end" style={{ borderColor: colors.border }}>
          <button onClick={handleContinue} className="px-8 py-3 rounded-full font-semibold transition-all hover:opacity-90" style={{ backgroundColor: colors.lime, color: colors.bg }}>
            Review metrics
          </button>
        </div>
      </div>
    </div>
  )
}

function ScreenshotUpload({ onUpload, isExtracting, error, onClearError }: any) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Analytics screenshot (optional)</label>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={e => {
          const file = e.currentTarget.files?.[0]
          if (file) onUpload(file)
        }}
        disabled={isExtracting}
        className="block w-full text-sm"
        style={{ color: colors.textSecondary }}
      />
      {isExtracting && <p className="text-xs mt-2" style={{ color: colors.lime }}>Extracting metrics...</p>}
      {error && (
        <div className="mt-2 p-3 rounded text-xs border" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.orange }}>
          {error}
          <button onClick={onClearError} className="ml-2 underline">Dismiss</button>
        </div>
      )}
    </div>
  )
}

function MetricsForm({ metrics, onChange }: any) {
  const handleChange = (key: string, value: string) => {
    onChange({
      ...metrics,
      [key]: value === '' ? null : parseInt(value, 10),
    })
  }

  const fields = [
    { key: 'views', label: 'Views' },
    { key: 'likes', label: 'Likes' },
    { key: 'comments', label: 'Comments' },
    { key: 'shares', label: 'Shares' },
    { key: 'newFollowers', label: 'Followers gained' },
    { key: 'videoLengthSeconds', label: 'Length (seconds)' },
    { key: 'avgWatchTimeSeconds', label: 'Avg watch time (sec)' },
  ]

  return (
    <div className="grid grid-cols-2 gap-2">
      {fields.map(field => (
        <div key={field.key}>
          <label className="text-xs block mb-1" style={{ color: colors.textTertiary }}>{field.label}</label>
          <input
            type="number"
            value={metrics[field.key] ?? ''}
            onChange={e => handleChange(field.key, e.target.value)}
            className="w-full px-3 py-2 rounded text-sm border"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
          />
        </div>
      ))}
    </div>
  )
}

// ===== CONTEXT SCREEN =====

function ContextScreen({ strongVideo, weakVideo, onComplete }: any) {
  const [strongTopic, setStrongTopic] = useState('')
  const [weakTopic, setWeakTopic] = useState('')

  const handleContinue = () => {
    if (!strongTopic || !weakTopic) {
      alert('Enter topics for both videos')
      return
    }

    onComplete({
      strongVideo: { ...strongVideo, topic: strongTopic },
      underperformingVideo: { ...weakVideo, topic: weakTopic },
    })
  }

  return (
    <div style={{ backgroundColor: colors.bg, minHeight: '100vh' }}>
      <header style={{ borderBottom: `1px solid ${colors.border}`, position: 'sticky', top: 0 }}>
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between py-4">
          <h1 className="text-xl font-light">Creative details</h1>
          <button onClick={handleContinue} className="text-sm py-2 px-6 rounded-full font-semibold transition-all hover:opacity-90" style={{ backgroundColor: colors.lime, color: colors.bg }}>
            Continue
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-16">
          <div className="animate-slide-up">
            <label className="block text-sm font-medium mb-3" style={{ color: colors.textSecondary }}>Topic</label>
            <input
              type="text"
              value={strongTopic}
              onChange={e => setStrongTopic(e.target.value)}
              placeholder="e.g., Career transition"
              className="w-full px-4 py-3 rounded text-sm border"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
            />
          </div>

          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <label className="block text-sm font-medium mb-3" style={{ color: colors.textSecondary }}>Topic</label>
            <input
              type="text"
              value={weakTopic}
              onChange={e => setWeakTopic(e.target.value)}
              placeholder="e.g., Job search tips"
              className="w-full px-4 py-3 rounded text-sm border"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
            />
          </div>
        </div>

        <div className="border-t mt-16 pt-8 flex gap-4 justify-end" style={{ borderColor: colors.border }}>
          <button onClick={handleContinue} className="px-8 py-3 rounded-full font-semibold transition-all hover:opacity-90" style={{ backgroundColor: colors.lime, color: colors.bg }}>
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== QUESTIONS SCREEN =====

function QuestionsScreen({ onAnalyze }: any) {
  const [goal, setGoal] = useState('')
  const [changes, setChanges] = useState<string[]>([])

  const goals = ['Get more views', 'Gain followers', 'Increase engagement', 'Drive sales or clicks', 'Educate my audience']

  const handleAnalyze = () => {
    if (!goal) {
      alert('Select your primary goal')
      return
    }
    onAnalyze(goal, changes)
  }

  return (
    <div style={{ backgroundColor: colors.bg, minHeight: '100vh' }}>
      <header style={{ borderBottom: `1px solid ${colors.border}`, position: 'sticky', top: 0 }}>
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between py-4">
          <h1 className="text-xl font-light">What's your goal?</h1>
          <button onClick={handleAnalyze} className="text-sm py-2 px-6 rounded-full font-semibold transition-all hover:opacity-90" style={{ backgroundColor: colors.lime, color: colors.bg }}>
            Analyze
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="max-w-2xl space-y-16">
          <div className="animate-slide-up">
            <h3 className="text-2xl font-normal mb-8">Primary goal</h3>
            <div className="space-y-3">
              {goals.map(g => (
                <label key={g} className="flex items-center cursor-pointer group">
                  <input
                    type="radio"
                    name="goal"
                    value={g}
                    checked={goal === g}
                    onChange={e => setGoal(e.target.value)}
                    className="w-4 h-4 mr-4 accent-lime-500"
                  />
                  <span className="text-base transition-colors" style={{ color: goal === g ? colors.lime : colors.textPrimary }}>
                    {g}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t mt-16 pt-8 flex gap-4 justify-end" style={{ borderColor: colors.border }}>
          <button onClick={handleAnalyze} className="px-8 py-3 rounded-full font-semibold transition-all hover:opacity-90" style={{ backgroundColor: colors.lime, color: colors.bg }}>
            Generate coaching
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== REPORT SCREEN =====

function ReportScreen({ report, strongVideo, weakVideo, onStartOver }: any) {
  return (
    <div style={{ backgroundColor: colors.bg, minHeight: '100vh' }}>
      <header style={{ borderBottom: `1px solid ${colors.border}`, position: 'sticky', top: 0 }}>
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between py-4">
          <h1 className="text-xl font-light">Your coaching plan</h1>
          <button onClick={onStartOver} className="text-xs" style={{ color: colors.textSecondary }}>
            Analyze another pair
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-24 space-y-24">
        {/* Main Insight */}
        <div className="animate-slide-up">
          <h2 className="text-4xl font-light mb-8 leading-tight max-w-3xl" style={{ color: colors.textPrimary }}>
            The biggest thing I'd tell you
          </h2>
          <p className="text-lg max-w-2xl leading-relaxed" style={{ color: colors.textSecondary }}>
            {report.coachingSummary}
          </p>
        </div>

        {/* Performance Comparison */}
        <MetricComparisonDisplay metrics={report.performanceMetrics} />

        {/* Biggest Difference */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-2xl font-normal mb-8" style={{ color: colors.textPrimary }}>What the numbers are really saying</h3>
          <p className="text-base leading-relaxed" style={{ color: colors.textSecondary }}>
            {report.biggestDifference}
          </p>
        </div>

        {/* Experiments */}
        <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-2xl font-normal mb-8" style={{ color: colors.textPrimary }}>What I'd test next</h3>
          <div className="space-y-4">
            {report.experiments.map((exp: any, i: number) => (
              <div key={i} className="border rounded p-6 animate-fade-in" style={{ backgroundColor: colors.surface, borderColor: colors.border, animationDelay: `${0.4 + i * 0.1}s` }}>
                <div className="flex items-baseline justify-between mb-4">
                  <h4 className="text-lg font-medium">{exp.title}</h4>
                  <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: colors.bg, color: colors.lime }}>{exp.confidence}</span>
                </div>
                <div className="grid md:grid-cols-2 gap-8 mb-4 text-sm">
                  <div>
                    <p className="mb-2" style={{ color: colors.textTertiary }}>Change</p>
                    <p style={{ color: colors.textPrimary }}>{exp.change}</p>
                  </div>
                  <div>
                    <p className="mb-2" style={{ color: colors.textTertiary }}>Keep constant</p>
                    <p style={{ color: colors.textPrimary }}>{exp.keepConstant.join(', ')}</p>
                  </div>
                </div>
                <div className="p-3 rounded border" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
                  <p className="text-sm" style={{ color: colors.textPrimary }}><strong style={{ color: colors.lime }}>Watch:</strong> {exp.metricToWatch}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Week Plan */}
        <NextWeekPlanSection plan={report.nextWeekPlan} />

        {/* Actions */}
        <div className="border-t pt-8 flex gap-4" style={{ borderColor: colors.border }}>
          <button onClick={onStartOver} className="px-8 py-3 rounded-full font-semibold transition-all hover:opacity-90" style={{ backgroundColor: colors.lime, color: colors.bg }}>
            Analyze another pair
          </button>
        </div>
      </div>
    </div>
  )
}

function MetricComparisonDisplay({ metrics }: any) {
  if (!metrics || metrics.length === 0) return null

  return (
    <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
      <h3 className="text-2xl font-normal mb-8" style={{ color: colors.textPrimary }}>What the numbers are really saying</h3>
      <div className="space-y-4">
        {metrics.map((metric: any, i: number) => {
          const maxValue = Math.max(metric.strongValue, metric.weakValue)
          const strongWidth = (metric.strongValue / maxValue) * 100
          const weakWidth = (metric.weakValue / maxValue) * 100

          return (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-baseline text-sm" style={{ color: colors.textSecondary }}>
                <span>{metric.name}</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <span className="text-xs w-20" style={{ color: colors.textTertiary }}>Strong</span>
                  <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: colors.surface }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(strongWidth, 100)}%`, backgroundColor: colors.lime, transition: 'width 0.8s ease-out' }}
                    />
                  </div>
                  <span className="text-sm font-medium w-16 text-right" style={{ color: colors.textPrimary }}>
                    {metric.strongValue.toFixed(metric.isPercentage ? 1 : 0)}{metric.isPercentage ? '%' : metric.unit}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs w-20" style={{ color: colors.textTertiary }}>Underperforming</span>
                  <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: colors.surface }}>
                    <div
                      className="h-full rounded-full opacity-60"
                      style={{ width: `${Math.min(weakWidth, 100)}%`, backgroundColor: colors.orange, transition: 'width 0.8s ease-out' }}
                    />
                  </div>
                  <span className="text-sm font-medium w-16 text-right" style={{ color: colors.textPrimary }}>
                    {metric.weakValue.toFixed(metric.isPercentage ? 1 : 0)}{metric.isPercentage ? '%' : metric.unit}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function NextWeekPlanSection({ plan }: any) {
  return (
    <div className="animate-slide-up" style={{ animationDelay: '0.8s' }}>
      <h2 className="text-3xl font-light mb-4">Here's what I'd post next week</h2>
      <p className="mb-16" style={{ color: colors.textSecondary }}>An exact creative brief based on your analysis.</p>

      <div className="space-y-16">
        <div>
          <p className="text-xs mb-2" style={{ color: colors.textTertiary }}>Video idea</p>
          <p className="text-base leading-relaxed" style={{ color: colors.textPrimary }}>{plan.videoIdea}</p>
        </div>

        <div>
          <p className="text-xs mb-2" style={{ color: colors.textTertiary }}>Hook (exact opening line)</p>
          <p className="text-lg font-light italic" style={{ color: colors.lime }}>"{plan.hook}"</p>
        </div>

        <div>
          <p className="text-xs mb-4" style={{ color: colors.textTertiary }}>Structure</p>
          <div className="space-y-2">
            {plan.structure.map((step: any, i: number) => (
              <div key={i} className="flex gap-4">
                <span className="text-sm font-medium min-w-fit" style={{ color: colors.lime }}>{step.timeRange}</span>
                <p className="text-sm" style={{ color: colors.textSecondary }}>{step.instruction}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs mb-2" style={{ color: colors.textTertiary }}>Call to action</p>
          <p className="text-base" style={{ color: colors.textPrimary }}>"{plan.cta}"</p>
        </div>

        <div className="p-6 rounded border" style={{ backgroundColor: colors.surface, borderColor: colors.lime }}>
          <p className="text-xs mb-3 font-medium" style={{ color: colors.lime }}>Why this is the right test</p>
          <p className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>{plan.whyThisTest}</p>
        </div>

        <div>
          <p className="text-xs mb-2" style={{ color: colors.textTertiary }}>Primary metric to watch</p>
          <p className="text-base font-medium" style={{ color: colors.textPrimary }}>{plan.metricToWatch}</p>
        </div>
      </div>
    </div>
  )
}

// ===== REPORT GENERATION =====

function generateCoachingReport(context: CoachingContext): any {
  const strong = context.strongVideo
  const weak = context.underperformingVideo

  const biggestDiff = findBiggestDifference(strong, weak)
  const coachingSummary = generateCoachingSummary(strong, weak, biggestDiff)
  const whatWorked = identifyStrengths(strong, weak, calculateDerivedMetrics(strong))
  const likelyContributors = identifyContributors(strong, weak)
  const cannotConclude = identifyConfounders(strong, weak)
  const experiments = generateExperiments(strong, weak, context.primaryGoal, context.changesNoticed)
  const performanceMetrics = selectPerformanceMetrics(strong, weak)
  const nextWeekPlan = generateNextWeekPlan(strong, weak, context.primaryGoal, experiments)

  return {
    coachingSummary,
    biggestDifference: biggestDiff
      ? `${biggestDiff.metric}: The stronger video had a ${(biggestDiff.percentChange * 100).toFixed(0)}% advantage. This likely influenced the algorithm's decision to amplify it.`
      : 'The videos have similar metrics.',
    whatWorked,
    likelyContributors,
    cannotConclude,
    experiments,
    performanceMetrics,
    nextWeekPlan,
  }
}
