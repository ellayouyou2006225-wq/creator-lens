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

export default function Home() {
  const [appState, setAppState] = useState<AppState>({
    screen: 'landing',
    strongVideo: null,
    underperformingVideo: null,
    context: {},
    report: null,
    error: null,
  })

  // ===== HANDLERS =====

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

  // ===== SCREENS =====

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-teal-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">CreatorLens</h1>
          <p className="text-gray-600">AI coaching for your TikTok content</p>
        </div>

        {/* Main Content */}
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

        {appState.error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {appState.error}
          </div>
        )}
      </div>
    </div>
  )
}

// ===== SCREEN COMPONENTS =====

function LandingScreen({
  onStartAnalysis,
  onTryDemo,
}: {
  onStartAnalysis: () => void
  onTryDemo: () => void
}) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-12 text-center">
        <h2 className="text-3xl font-bold mb-4 text-gray-900">
          Turn your TikTok analytics into your next content decision
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Upload analytics from one strong video and one underperforming video. CreatorLens will identify meaningful differences and give you three experiments for your next post.
        </p>

        <div className="bg-teal-50 rounded-lg p-6 mb-8 text-sm text-gray-700 space-y-2">
          <div className="font-semibold text-teal-900 mb-3">How it works:</div>
          <div>1️⃣ Enter metrics from your two videos</div>
          <div>2️⃣ Verify the numbers and add creative context</div>
          <div>3️⃣ Get your personalized coaching plan</div>
        </div>

        <div className="flex gap-4 flex-col sm:flex-row">
          <button
            onClick={onStartAnalysis}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            Analyze my videos
          </button>
          <button
            onClick={onTryDemo}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-lg transition"
          >
            Try a sample analysis
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          No account required. Your data is processed only for this analysis.
        </p>
      </div>
    </div>
  )
}

function VideoInputScreen({
  onComplete,
}: {
  onComplete: (strong: VideoInput, weak: VideoInput) => void
}) {
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

  const handleScreenshotUpload = async (
    file: File,
    isStrong: boolean
  ) => {
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

      // Map extracted metrics to state
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

      // Show warnings if any
      if (data.warnings && data.warnings.length > 0) {
        setError(`Extracted successfully, but: ${data.warnings.join(', ')}. You can edit below.`)
      }
    } catch (err) {
      setError('Upload failed. Try manual entry or try again.')
    } finally {
      setExtracting(false)
    }
  }

  const handleContinue = () => {
    // Validation
    if (!strongMetrics.views || !weakMetrics.views) {
      alert('Please enter views for both videos')
      return
    }
    if (!strongHook || !weakHook) {
      alert('Please enter hooks for both videos')
      return
    }

    const strong: VideoInput = {
      performance: 'strong',
      metrics: strongMetrics,
      topic: '',
      hook: strongHook,
      format: 'talking-head',
    }

    const weak: VideoInput = {
      performance: 'underperforming',
      metrics: weakMetrics,
      topic: '',
      hook: weakHook,
      format: 'talking-head',
    }

    onComplete(strong, weak)
  }

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Strong Video */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-green-700 mb-4">✓ Strong Video</h3>
          <p className="text-sm text-gray-600 mb-6">One that performed better than usual</p>

          {/* Screenshot Upload */}
          <ScreenshotUpload
            onUpload={file => handleScreenshotUpload(file, true)}
            isExtracting={extractingStrong}
            error={errorStrong}
            onClearError={() => setErrorStrong(null)}
          />

          <MetricsForm
            metrics={strongMetrics}
            onChange={setStrongMetrics}
            prefix="strong"
          />

          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              First 3 seconds (opening hook)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              What did viewers see first? This helps explain why they stayed or left.
            </p>
            <textarea
              value={strongHook}
              onChange={e => setStrongHook(e.target.value)}
              placeholder="e.g., 'I quit my tech job after 5 years'"
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              rows={2}
            />
          </div>
        </div>

        {/* Weak Video */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-orange-600 mb-4">✗ Underperforming Video</h3>
          <p className="text-sm text-gray-600 mb-6">One that performed worse than expected</p>

          {/* Screenshot Upload */}
          <ScreenshotUpload
            onUpload={file => handleScreenshotUpload(file, false)}
            isExtracting={extractingWeak}
            error={errorWeak}
            onClearError={() => setErrorWeak(null)}
          />

          <MetricsForm
            metrics={weakMetrics}
            onChange={setWeakMetrics}
            prefix="weak"
          />

          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              First 3 seconds (opening hook)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              What did viewers see first?
            </p>
            <textarea
              value={weakHook}
              onChange={e => setWeakHook(e.target.value)}
              placeholder="e.g., 'Today I want to share some helpful tips'"
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              rows={2}
            />
          </div>
        </div>
      </div>

      <div className="bg-teal-50 border border-teal-200 rounded p-4 text-sm text-teal-900">
        <strong>Tip:</strong> Upload a screenshot of your TikTok Analytics for quick extraction. All fields are editable.
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleContinue}
          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded transition"
        >
          Continue
        </button>
      </div>
    </div>
  )
}

function ScreenshotUpload({
  onUpload,
  isExtracting,
  error,
  onClearError,
}: {
  onUpload: (file: File) => void
  isExtracting: boolean
  error: string | null
  onClearError: () => void
}) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-900 mb-3">
        Upload TikTok Analytics Screenshot (optional)
      </label>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={e => {
          const file = e.currentTarget.files?.[0]
          if (file) {
            onUpload(file)
          }
        }}
        disabled={isExtracting}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 disabled:opacity-50"
      />
      {isExtracting && <p className="text-xs text-teal-600 mt-2">Extracting metrics...</p>}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {error}
          <button
            onClick={onClearError}
            className="ml-2 underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}

function MetricsForm({
  metrics,
  onChange,
  prefix,
}: {
  metrics: RawMetrics
  onChange: (m: RawMetrics) => void
  prefix: string
}) {
  const handleChange = (key: keyof RawMetrics, value: string) => {
    onChange({
      ...metrics,
      [key]: value === '' ? null : parseInt(value, 10),
    })
  }

  const fields = [
    { key: 'views', label: 'Views', placeholder: '12500' },
    { key: 'likes', label: 'Likes', placeholder: '450' },
    { key: 'comments', label: 'Comments', placeholder: '120' },
    { key: 'shares', label: 'Shares', placeholder: '80' },
    { key: 'newFollowers', label: 'Followers gained', placeholder: '50' },
    { key: 'videoLengthSeconds', label: 'Video length (seconds)', placeholder: '45' },
    { key: 'avgWatchTimeSeconds', label: 'Avg watch time (seconds)', placeholder: '40' },
  ]

  return (
    <div className="space-y-3">
      {fields.map(field => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            {field.label}
          </label>
          <input
            type="number"
            value={metrics[field.key as keyof RawMetrics] ?? ''}
            onChange={e => handleChange(field.key as keyof RawMetrics, e.target.value)}
            placeholder={field.placeholder}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      ))}
    </div>
  )
}

function ContextScreen({
  strongVideo,
  weakVideo,
  onComplete,
}: {
  strongVideo: VideoInput
  weakVideo: VideoInput
  onComplete: (context: Partial<CoachingContext>) => void
}) {
  const [strongTopic, setStrongTopic] = useState('')
  const [weakTopic, setWeakTopic] = useState('')
  const [strongFormat, setStrongFormat] = useState<'talking-head'>('talking-head')
  const [weakFormat, setWeakFormat] = useState<'talking-head'>('talking-head')

  const formatOptions = [
    'talking-head',
    'voiceover',
    'slideshow',
    'vlog',
    'screen-recording',
    'interview',
    'other',
  ]

  const handleContinue = () => {
    if (!strongTopic || !weakTopic) {
      alert('Please enter topics for both videos')
      return
    }

    onComplete({
      strongVideo: { ...strongVideo, topic: strongTopic, format: strongFormat as any },
      underperformingVideo: { ...weakVideo, topic: weakTopic, format: weakFormat as any },
    })
  }

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Strong */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-green-700 mb-4">Strong Video</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Topic</label>
              <input
                type="text"
                value={strongTopic}
                onChange={e => setStrongTopic(e.target.value)}
                placeholder="e.g., Career transition"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Format</label>
              <select
                value={strongFormat}
                onChange={e => setStrongFormat(e.target.value as any)}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {formatOptions.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Weak */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-orange-600 mb-4">Underperforming Video</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Topic</label>
              <input
                type="text"
                value={weakTopic}
                onChange={e => setWeakTopic(e.target.value)}
                placeholder="e.g., Job search tips"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Format</label>
              <select
                value={weakFormat}
                onChange={e => setWeakFormat(e.target.value as any)}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {formatOptions.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleContinue}
          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded transition"
        >
          Continue
        </button>
      </div>
    </div>
  )
}

function QuestionsScreen({ onAnalyze }: { onAnalyze: (goal: string, changes: string[], context?: string) => void }) {
  const [goal, setGoal] = useState('')
  const [changes, setChanges] = useState<string[]>([])
  const [additionalContext, setAdditionalContext] = useState('')

  const changeOptions = [
    'Opening hook',
    'Topic',
    'Video length',
    'Editing pace',
    'Video format',
    'Call to action',
    'Posting time',
    'Caption',
    'Sound or music',
    'Visual style',
    'I am not sure',
  ]

  const handleToggleChange = (option: string) => {
    setChanges(prev =>
      prev.includes(option) ? prev.filter(c => c !== option) : [...prev, option]
    )
  }

  const handleAnalyze = () => {
    if (!goal) {
      alert('Please select your primary goal')
      return
    }

    onAnalyze(goal, changes, additionalContext)
  }

  return (
    <div className="bg-white rounded-lg shadow p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Almost there</h2>

      <div className="mb-8">
        <label className="block text-lg font-semibold text-gray-900 mb-4">
          What was your primary goal?
        </label>
        <div className="space-y-2">
          {['Get more views', 'Gain followers', 'Increase engagement', 'Drive sales or clicks', 'Educate my audience'].map(
            opt => (
              <label key={opt} className="flex items-center">
                <input
                  type="radio"
                  name="goal"
                  value={opt}
                  checked={goal === opt}
                  onChange={e => setGoal(e.target.value)}
                  className="mr-3"
                />
                <span className="text-gray-900">{opt}</span>
              </label>
            )
          )}
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-lg font-semibold text-gray-900 mb-4">
          What changed between these videos?
        </label>
        <div className="grid grid-cols-2 gap-3">
          {changeOptions.map(option => (
            <button
              key={option}
              onClick={() => handleToggleChange(option)}
              className={`text-left px-4 py-2 rounded border-2 transition ${
                changes.includes(option)
                  ? 'border-teal-600 bg-teal-50'
                  : 'border-gray-200 bg-white hover:border-teal-300'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Anything else CreatorLens should know? (optional)
        </label>
        <textarea
          value={additionalContext}
          onChange={e => setAdditionalContext(e.target.value)}
          placeholder="e.g., Both posted on Tuesday at 2pm"
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          rows={3}
        />
      </div>

      <button
        onClick={handleAnalyze}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded transition"
      >
        Get your coaching plan
      </button>
    </div>
  )
}

// ===== NEW UI COMPONENTS =====

function MetricComparison({ metrics }: { metrics: any[] }) {
  if (!metrics || metrics.length === 0) return null

  return (
    <div className="bg-white rounded-lg shadow p-8 mb-8">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Your biggest performance differences</h3>
      <div className="space-y-6">
        {metrics.map((metric, i) => {
          const maxValue = Math.max(metric.strongValue, metric.weakValue)
          const strongWidth = (metric.strongValue / maxValue) * 100
          const weakWidth = (metric.weakValue / maxValue) * 100

          return (
            <div key={i}>
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-gray-900">{metric.name}</span>
              </div>

              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-700 w-24">Strong video</span>
                  <div className="flex-1 bg-gray-200 rounded h-6 overflow-hidden">
                    <div
                      className="bg-green-600 h-full transition-all"
                      style={{ width: `${Math.min(strongWidth, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-20 text-right">
                    {metric.strongValue.toFixed(1)}{metric.unit}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-orange-700 w-24">Underperforming</span>
                  <div className="flex-1 bg-gray-200 rounded h-6 overflow-hidden">
                    <div
                      className="bg-orange-600 h-full transition-all"
                      style={{ width: `${Math.min(weakWidth, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-20 text-right">
                    {metric.weakValue.toFixed(1)}{metric.unit}
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

function HookGenerator({ weakVideo, strongVideo, report }: { weakVideo: VideoInput; strongVideo: VideoInput; report: any }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [hooks, setHooks] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateHooks = async () => {
    setIsGenerating(true)
    setError(null)

    const payload = {
      currentHook: weakVideo.hook,
      topic: weakVideo.topic,
      strongHook: strongVideo.hook,
      strongTopic: strongVideo.topic,
      primaryGoal: 'follower growth',
      biggestInsight: report.biggestDifference,
      watchPercentageDifference: '45% vs 60%',
      engagementDifference: '3.2% vs 5.1%',
    }

    console.log('Sending hook request:', payload)

    try {
      const response = await fetch('/api/generate-hooks', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      console.log('Hook response:', { status: response.status, data })

      if (!data.success) {
        const errorMsg = data.missingFields 
          ? `Missing required fields: ${data.missingFields.join(', ')}`
          : data.error || 'Failed to generate hooks'
        console.error('Hook generation error:', errorMsg)
        setError(errorMsg)
        setIsGenerating(false)
        return
      }

      setHooks(data.hooks)
    } catch (err) {
      console.error('Hook fetch error:', err)
      setError('Error generating hooks. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyHook = (hook: string) => {
    navigator.clipboard.writeText(hook)
    alert('Hook copied!')
  }

  return (
    <div className="bg-white rounded-lg shadow p-8 mb-8">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Coach my hook</h3>

      <div className="mb-6 p-4 bg-gray-50 rounded">
        <p className="text-sm text-gray-600 mb-2">Current hook:</p>
        <p className="font-semibold text-gray-900">"{weakVideo.hook}"</p>
      </div>

      {!hooks && (
        <button
          onClick={handleGenerateHooks}
          disabled={isGenerating}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded transition"
        >
          {isGenerating ? 'Generating stronger hooks...' : 'Generate stronger hooks'}
        </button>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 mb-4">
          {error}
          <button
            onClick={handleGenerateHooks}
            className="ml-3 underline font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {hooks && (
        <div className="space-y-4">
          {hooks.map((hook, i) => (
            <div key={i} className="border border-gray-200 rounded p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-semibold text-teal-600 bg-teal-50 px-2 py-1 rounded">
                  {hook.style}
                </span>
                <button
                  onClick={() => handleCopyHook(hook.hook)}
                  className="text-sm text-teal-600 hover:text-teal-700 underline"
                >
                  Copy
                </button>
              </div>
              <p className="font-semibold text-gray-900 mb-2">"{hook.hook}"</p>
              <p className="text-sm text-gray-700 mb-2"><strong>Why stronger:</strong> {hook.whyItIsStronger}</p>
              <p className="text-sm text-gray-600"><strong>Based on:</strong> {hook.basedOn}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function NextWeekPlanDisplay({ plan }: { plan: any }) {
  return (
    <div className="bg-white rounded-lg shadow p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">If I were your content coach next week...</h3>
      <p className="text-gray-600 mb-8">Here is exactly what I would have you post next.</p>

      <div className="space-y-8">
        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-3">Video idea</h4>
          <p className="text-gray-700">{plan.videoIdea}</p>
        </div>

        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-3">Hook</h4>
          <p className="text-base font-semibold text-gray-900 italic">"{plan.hook}"</p>
        </div>

        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-3">Structure</h4>
          <div className="space-y-3">
            {plan.structure.map((step: any, i: number) => (
              <div key={i} className="flex gap-4">
                <span className="font-semibold text-teal-600 min-w-fit">{step.timeRange}</span>
                <span className="text-gray-700">{step.instruction}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-3">CTA</h4>
          <p className="text-gray-700">"{plan.cta}"</p>
        </div>

        <div className="bg-teal-50 border border-teal-200 rounded p-4">
          <h4 className="font-semibold text-teal-900 mb-2">Why this is the right next test</h4>
          <p className="text-gray-700">{plan.whyThisTest}</p>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Metric to watch</h4>
          <p className="text-gray-700">{plan.metricToWatch}</p>
        </div>
      </div>
    </div>
  )
}

function ReportScreen({
  report,
  strongVideo,
  weakVideo,
  onStartOver,
}: {
  report: any
  strongVideo: VideoInput
  weakVideo: VideoInput
  onStartOver: () => void
}) {
  const handlePrint = () => {
    window.print()
  }

  const handleCopy = () => {
    const text = `Coaching Summary\n${report.coachingSummary}\n\n` +
      `Biggest Difference\n${report.biggestDifference}\n\n` +
      `What Worked\n${report.whatWorked.map((s: any) => `${s.title}: ${s.evidence}`).join('\n')}\n\n` +
      `What Held You Back\n${report.likelyContributors.map((c: any) => `${c.title}: ${c.evidence}`).join('\n')}\n\n` +
      `Experiments\n${report.experiments.map((e: any) => `${e.title}: ${e.change}`).join('\n')}\n\n` +
      `Coaching Bullets\n${report.coachingBullets.join('\n')}`
    
    navigator.clipboard.writeText(text)
    alert('Coaching plan copied!')
  }

  return (
    <div className="space-y-8">
      {/* Coaching Summary */}
      <div className="bg-white rounded-lg shadow p-8 border-l-4 border-teal-600">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Your Coaching Plan</h2>
        <p className="text-lg text-gray-700">{report.coachingSummary}</p>
      </div>

      {/* Performance Metrics Comparison */}
      <MetricComparison metrics={report.performanceMetrics} />

      {/* Biggest Difference */}
      <div className="bg-teal-50 border border-teal-200 rounded p-6">
        <h3 className="font-semibold text-teal-900 mb-2">Biggest insight</h3>
        <p className="text-gray-700">{report.biggestDifference}</p>
      </div>

      {/* Three Experiments */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Three Experiments to Test</h3>
        <div className="space-y-4">
          {report.experiments.map((exp: any, i: number) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <h4 className="text-lg font-bold text-gray-900">{exp.title}</h4>
                <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2 py-1 rounded">
                  {exp.confidence}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Change</p>
                  <p className="text-gray-700">{exp.change}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Keep constant</p>
                  <p className="text-gray-700">{exp.keepConstant.join(', ')}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Metric to watch</p>
                  <p className="text-gray-700">{exp.metricToWatch}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Success signal</p>
                  <p className="text-gray-700">{exp.successSignal}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded p-3">
                <p className="text-sm text-gray-700"><strong>Why:</strong> {exp.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What Worked */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">What Worked</h3>
        <div className="space-y-3">
          {report.whatWorked.map((strength: any, i: number) => (
            <div key={i} className="bg-green-50 border border-green-200 rounded p-4">
              <h4 className="font-semibold text-green-900 mb-2">{strength.title}</h4>
              <p className="text-sm text-green-800 mb-2">{strength.evidence}</p>
              <p className="text-sm text-green-700"><strong>Takeaway:</strong> {strength.takeaway}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What Held It Back */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">What Likely Held It Back</h3>
        <div className="space-y-3">
          {report.likelyContributors.map((contributor: any, i: number) => (
            <div key={i} className="bg-orange-50 border border-orange-200 rounded p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-orange-900">{contributor.title}</h4>
                <span className="text-xs text-orange-600">{contributor.confidence}</span>
              </div>
              <p className="text-sm text-orange-800 mb-2">{contributor.evidence}</p>
              <p className="text-sm text-orange-700">{contributor.explanation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cannot Conclude */}
      {report.cannotConclude.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded p-6">
          <h3 className="font-semibold text-blue-900 mb-3">What We Cannot Conclude</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            {report.cannotConclude.map((item: string, i: number) => (
              <li key={i} className="flex gap-2">
                <span>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Coach My Hook */}
      <HookGenerator weakVideo={weakVideo} strongVideo={strongVideo} report={report} />

      {/* Next Week Plan */}
      <NextWeekPlanDisplay plan={report.nextWeekPlan} />

      {/* Actions */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <button
          onClick={handleCopy}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded transition"
        >
          Copy coaching plan
        </button>
        <button
          onClick={handlePrint}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded transition"
        >
          Print
        </button>
        <button
          onClick={onStartOver}
          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded transition"
        >
          Analyze another pair
        </button>
      </div>
    </div>
  )
}

// ===== COACHING REPORT GENERATION =====

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

  const coachingBullets = [
    whatWorked.length > 0 ? whatWorked[0].takeaway : 'Focus on your strengths.',
    experiments.length > 0 ? `Test ${experiments[0].change.toLowerCase()}.` : 'Run one controlled test.',
    `Track ${experiments.length > 0 ? experiments[0].metricToWatch.toLowerCase() : 'your key metric'} for the next three uploads.`,
  ]

  return {
    coachingSummary,
    biggestDifference: biggestDiff
      ? `${biggestDiff.metric}: The stronger video had a ${(biggestDiff.percentChange * 100).toFixed(0)}% advantage. This likely influenced the algorithm's decision to amplify it.`
      : 'The videos have similar metrics.',
    whatWorked,
    likelyContributors,
    cannotConclude,
    experiments,
    coachingBullets,
    performanceMetrics,
    nextWeekPlan,
  }
}
