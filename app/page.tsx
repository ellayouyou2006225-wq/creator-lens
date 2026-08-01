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
    <div className="page-container">
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
    <div className="page-container min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-dark-border">
        <div className="content-max-width py-lg flex items-center justify-between">
          <h1 className="text-2xl font-light tracking-tight">CreatorLens</h1>
          <div className="text-xs text-text-tertiary">v1</div>
        </div>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="content-max-width">
          <div className="mb-3xl">
            <p className="text-accent-lime text-sm font-medium mb-xl">Your post-performance content coach</p>
            <h2 className="text-5xl md:text-6xl font-light leading-tight mb-2xl max-w-3xl">
              Turn your analytics into your next creative decision.
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mb-4xl leading-relaxed">
              Compare one strong video with one that underperformed. See what likely made the difference and what to test next.
            </p>
          </div>

          {/* Process */}
          <div className="grid md:grid-cols-3 gap-2xl mb-4xl">
            {[
              { num: '1', label: 'Upload analytics', desc: 'Screenshot or manual entry' },
              { num: '2', label: 'Compare what changed', desc: 'See the metrics that matter' },
              { num: '3', label: 'Know what to post', desc: 'Get exact next steps' },
            ].map(step => (
              <div key={step.num} className="group">
                <div className="text-4xl font-light text-accent-lime mb-md opacity-60 group-hover:opacity-100 transition-opacity">{step.num}</div>
                <h4 className="font-medium text-text-primary mb-sm">{step.label}</h4>
                <p className="text-sm text-text-tertiary">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-lg">
            <button onClick={onStartAnalysis} className="btn-primary">
              Analyze my videos
            </button>
            <button onClick={onTryDemo} className="btn-secondary">
              Try a sample analysis
            </button>
          </div>

          <p className="text-xs text-text-tertiary mt-2xl">
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
    <div className="page-container">
      <header className="border-b border-dark-border sticky top-0 bg-dark-bg">
        <div className="content-max-width flex items-center justify-between py-lg">
          <h1 className="text-xl font-light">Enter your videos</h1>
          <button onClick={handleContinue} className="btn-primary text-sm py-md px-xl">
            Continue
          </button>
        </div>
      </header>

      <div className="content-max-width">
        <div className="grid md:grid-cols-2 gap-4xl py-4xl">
          {/* Strong Video */}
          <div className="animate-slide-up">
            <div className="mb-2xl">
              <div className="flex items-baseline gap-md mb-lg">
                <span className="text-accent-lime text-xl">✓</span>
                <h2 className="text-2xl font-light">Strong video</h2>
              </div>
              <p className="text-text-secondary text-sm">One that performed better than expected</p>
            </div>

            <div className="space-y-lg">
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
                <label className="input-label">Opening hook (first 3 seconds)</label>
                <textarea
                  value={strongHook}
                  onChange={e => setStrongHook(e.target.value)}
                  placeholder="e.g., I quit my tech job after 5 years"
                  className="w-full bg-dark-surface border border-dark-border rounded-base px-lg py-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-lime text-sm"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Weak Video */}
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="mb-2xl">
              <div className="flex items-baseline gap-md mb-lg">
                <span className="text-accent-orange text-xl">—</span>
                <h2 className="text-2xl font-light">Underperforming video</h2>
              </div>
              <p className="text-text-secondary text-sm">One that performed worse than expected</p>
            </div>

            <div className="space-y-lg">
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
                <label className="input-label">Opening hook (first 3 seconds)</label>
                <textarea
                  value={weakHook}
                  onChange={e => setWeakHook(e.target.value)}
                  placeholder="e.g., Today I want to share some helpful tips"
                  className="w-full bg-dark-surface border border-dark-border rounded-base px-lg py-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-lime text-sm"
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-dark-border py-4xl flex gap-lg justify-end">
          <button onClick={handleContinue} className="btn-primary">
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
      <label className="input-label">Analytics screenshot (optional)</label>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={e => {
          const file = e.currentTarget.files?.[0]
          if (file) onUpload(file)
        }}
        disabled={isExtracting}
        className="block w-full text-sm text-text-secondary file:mr-lg file:py-md file:px-lg file:rounded-base file:border file:border-dark-border file:bg-dark-surface file:text-text-secondary hover:file:border-accent-lime file:transition-colors disabled:opacity-50"
      />
      {isExtracting && <p className="text-xs text-accent-lime mt-md">Extracting metrics...</p>}
      {error && (
        <div className="mt-md p-md bg-dark-surface border border-dark-border rounded-base text-xs text-accent-orange">
          {error}
          <button onClick={onClearError} className="ml-md underline">Dismiss</button>
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
    <div className="grid grid-cols-2 gap-md">
      {fields.map(field => (
        <div key={field.key}>
          <label className="text-xs text-text-tertiary block mb-sm">{field.label}</label>
          <input
            type="number"
            value={metrics[field.key] ?? ''}
            onChange={e => handleChange(field.key, e.target.value)}
            className="w-full bg-dark-surface border border-dark-border rounded-base px-md py-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-lime text-sm"
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
  const [strongFormat, setStrongFormat] = useState('talking-head')
  const [weakFormat, setWeakFormat] = useState('talking-head')

  const formats = ['talking-head', 'voiceover', 'slideshow', 'vlog', 'screen-recording', 'interview', 'other']

  const handleContinue = () => {
    if (!strongTopic || !weakTopic) {
      alert('Enter topics for both videos')
      return
    }

    onComplete({
      strongVideo: { ...strongVideo, topic: strongTopic, format: strongFormat },
      underperformingVideo: { ...weakVideo, topic: weakTopic, format: weakFormat },
    })
  }

  return (
    <div className="page-container">
      <header className="border-b border-dark-border sticky top-0 bg-dark-bg">
        <div className="content-max-width flex items-center justify-between py-lg">
          <h1 className="text-xl font-light">Creative details</h1>
          <button onClick={handleContinue} className="btn-primary text-sm py-md px-xl">
            Continue
          </button>
        </div>
      </header>

      <div className="content-max-width">
        <div className="grid md:grid-cols-2 gap-4xl py-4xl">
          <div className="animate-slide-up space-y-lg">
            <div>
              <label className="input-label">Topic</label>
              <input
                type="text"
                value={strongTopic}
                onChange={e => setStrongTopic(e.target.value)}
                placeholder="e.g., Career transition"
              />
            </div>
            <div>
              <label className="input-label">Format</label>
              <select value={strongFormat} onChange={e => setStrongFormat(e.target.value)}>
                {formats.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="animate-slide-up space-y-lg" style={{ animationDelay: '0.1s' }}>
            <div>
              <label className="input-label">Topic</label>
              <input
                type="text"
                value={weakTopic}
                onChange={e => setWeakTopic(e.target.value)}
                placeholder="e.g., Job search tips"
              />
            </div>
            <div>
              <label className="input-label">Format</label>
              <select value={weakFormat} onChange={e => setWeakFormat(e.target.value)}>
                {formats.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="border-t border-dark-border py-4xl flex gap-lg justify-end">
          <button onClick={handleContinue} className="btn-primary">
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
  const changeOptions = ['Opening hook', 'Topic', 'Video length', 'Editing pace', 'Format', 'Call to action', 'Posting time', 'Caption', 'Sound', 'Visual style', 'Not sure']

  const handleAnalyze = () => {
    if (!goal) {
      alert('Select your primary goal')
      return
    }
    onAnalyze(goal, changes)
  }

  return (
    <div className="page-container">
      <header className="border-b border-dark-border sticky top-0 bg-dark-bg">
        <div className="content-max-width flex items-center justify-between py-lg">
          <h1 className="text-xl font-light">What's your goal?</h1>
          <button onClick={handleAnalyze} className="btn-primary text-sm py-md px-xl">
            Analyze
          </button>
        </div>
      </header>

      <div className="content-max-width">
        <div className="py-4xl space-y-4xl max-w-2xl">
          <div className="animate-slide-up">
            <h3 className="section-heading">Primary goal</h3>
            <div className="space-y-md">
              {goals.map(g => (
                <label key={g} className="flex items-center cursor-pointer group">
                  <input
                    type="radio"
                    name="goal"
                    value={g}
                    checked={goal === g}
                    onChange={e => setGoal(e.target.value)}
                    className="w-4 h-4 mr-lg accent-accent-lime"
                  />
                  <span className="text-base group-hover:text-accent-lime transition-colors">{g}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="section-heading">What changed between videos?</h3>
            <div className="grid grid-cols-2 gap-md">
              {changeOptions.map(option => (
                <button
                  key={option}
                  onClick={() =>
                    setChanges(prev =>
                      prev.includes(option) ? prev.filter(c => c !== option) : [...prev, option]
                    )
                  }
                  className={`text-left px-lg py-md rounded-base border transition-all ${
                    changes.includes(option)
                      ? 'border-accent-lime bg-dark-surface text-accent-lime'
                      : 'border-dark-border hover:border-text-secondary'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-dark-border py-4xl flex gap-lg justify-end">
          <button onClick={handleAnalyze} className="btn-primary">
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
    <div className="page-container">
      <header className="border-b border-dark-border sticky top-0 bg-dark-bg">
        <div className="content-max-width flex items-center justify-between py-lg">
          <h1 className="text-xl font-light">Your coaching plan</h1>
          <button onClick={onStartOver} className="btn-tertiary text-sm">
            Analyze another pair
          </button>
        </div>
      </header>

      <div className="content-max-width py-6xl space-y-6xl">
        {/* Main Insight */}
        <div className="animate-slide-up">
          <h2 className="text-4xl font-light mb-2xl leading-tight max-w-3xl">
            The biggest thing I'd tell you
          </h2>
          <p className="text-lg text-text-secondary mb-2xl leading-relaxed max-w-2xl">
            {report.coachingSummary}
          </p>
        </div>

        {/* Performance Comparison */}
        <MetricComparisonDisplay metrics={report.performanceMetrics} />

        {/* Biggest Difference */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="section-heading">What the numbers are really saying</h3>
          <p className="text-base text-text-secondary leading-relaxed">
            {report.biggestDifference}
          </p>
        </div>

        {/* Experiments */}
        <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <h3 className="section-heading">What I'd test next</h3>
          <div className="space-y-lg">
            {report.experiments.map((exp: any, i: number) => (
              <div key={i} className="bg-dark-surface border border-dark-border rounded-lg p-2xl animate-fade-in" style={{ animationDelay: `${0.4 + i * 0.1}s` }}>
                <div className="flex items-baseline justify-between mb-xl">
                  <h4 className="text-lg font-medium">{exp.title}</h4>
                  <span className="text-xs text-accent-lime bg-dark-bg px-md py-sm rounded-full">{exp.confidence}</span>
                </div>
                <div className="grid md:grid-cols-2 gap-2xl mb-lg text-sm">
                  <div>
                    <p className="text-text-tertiary mb-md">Change</p>
                    <p className="text-text-primary">{exp.change}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary mb-md">Keep constant</p>
                    <p className="text-text-primary">{exp.keepConstant.join(', ')}</p>
                  </div>
                </div>
                <div className="bg-dark-bg rounded p-md border border-dark-border">
                  <p className="text-sm"><strong className="text-accent-lime">Watch:</strong> {exp.metricToWatch}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What Worked */}
        <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <h3 className="section-heading">Keep doing this</h3>
          <div className="space-y-lg">
            {report.whatWorked.map((s: any, i: number) => (
              <div key={i} className="border-l-2 border-accent-lime pl-xl">
                <h4 className="font-medium mb-md">{s.title}</h4>
                <p className="text-text-secondary text-sm mb-md">{s.evidence}</p>
                <p className="text-text-tertiary text-sm"><strong className="text-accent-lime">Next time:</strong> {s.takeaway}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Likely Contributors */}
        <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <h3 className="section-heading">I'd experiment here</h3>
          <div className="space-y-lg">
            {report.likelyContributors.map((c: any, i: number) => (
              <div key={i} className="border-l-2 border-accent-orange pl-xl">
                <div className="flex items-baseline gap-md mb-md">
                  <h4 className="font-medium">{c.title}</h4>
                  <span className="text-xs text-accent-orange">{c.confidence}</span>
                </div>
                <p className="text-text-secondary text-sm mb-md">{c.evidence}</p>
                <p className="text-text-tertiary text-sm">{c.explanation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Confounders */}
        {report.cannotConclude.length > 0 && (
          <div className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <h3 className="section-heading">Don't assume this yet</h3>
            <ul className="space-y-md">
              {report.cannotConclude.map((item: string, i: number) => (
                <li key={i} className="text-text-secondary text-sm flex gap-md">
                  <span className="text-accent-violet">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Hook Generator */}
        <HookGeneratorSection weakVideo={weakVideo} strongVideo={strongVideo} report={report} />

        {/* Next Week Plan */}
        <NextWeekPlanSection plan={report.nextWeekPlan} />

        {/* Actions */}
        <div className="border-t border-dark-border pt-4xl flex gap-lg flex-wrap">
          <button onClick={() => window.print()} className="btn-secondary">
            Print coaching
          </button>
          <button onClick={onStartOver} className="btn-primary">
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
      <h3 className="section-heading">What the numbers are really saying</h3>
      <div className="space-y-xl">
        {metrics.map((metric: any, i: number) => {
          const maxValue = Math.max(metric.strongValue, metric.weakValue)
          const strongWidth = (metric.strongValue / maxValue) * 100
          const weakWidth = (metric.weakValue / maxValue) * 100

          return (
            <div key={i} className="space-y-md">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-medium text-text-secondary">{metric.name}</span>
              </div>

              <div className="space-y-sm">
                <div className="flex items-center gap-lg">
                  <span className="text-xs text-text-tertiary w-20">Strong</span>
                  <div className="flex-1 bg-dark-surface h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-accent-lime h-full rounded-full"
                      style={{ width: `${Math.min(strongWidth, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-text-primary w-16 text-right">
                    {metric.strongValue.toFixed(metric.isPercentage ? 1 : 0)}{metric.isPercentage ? '%' : metric.unit}
                  </span>
                </div>

                <div className="flex items-center gap-lg">
                  <span className="text-xs text-text-tertiary w-20">Underperforming</span>
                  <div className="flex-1 bg-dark-surface h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-accent-orange h-full rounded-full opacity-60"
                      style={{ width: `${Math.min(weakWidth, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-text-primary w-16 text-right">
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

function HookGeneratorSection({ weakVideo, strongVideo, report }: any) {
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

    try {
      const response = await fetch('/api/generate-hooks', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!data.success) {
        const errorMsg = data.missingFields
          ? `Missing: ${data.missingFields.join(', ')}`
          : data.error || 'Failed to generate'
        setError(errorMsg)
        setIsGenerating(false)
        return
      }

      setHooks(data.hooks)
    } catch (err) {
      setError('Error generating hooks')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyHook = (hook: string) => {
    navigator.clipboard.writeText(hook)
    alert('Hook copied!')
  }

  return (
    <div className="animate-slide-up" style={{ animationDelay: '0.7s' }}>
      <h3 className="section-heading">Let's improve your opening</h3>

      <div className="mb-2xl p-2xl bg-dark-surface border border-dark-border rounded-lg">
        <p className="text-xs text-text-tertiary mb-md">Current hook</p>
        <p className="text-base italic text-text-primary">"{weakVideo.hook}"</p>
      </div>

      {!hooks && (
        <button
          onClick={handleGenerateHooks}
          disabled={isGenerating}
          className="btn-primary w-full disabled:opacity-50"
        >
          {isGenerating ? 'Generating stronger hooks...' : 'Generate 3 stronger options'}
        </button>
      )}

      {error && (
        <div className="p-lg bg-dark-surface border border-dark-border rounded-lg text-error text-sm mb-lg">
          {error}
          <button onClick={handleGenerateHooks} className="ml-md underline">
            Retry
          </button>
        </div>
      )}

      {hooks && (
        <div className="space-y-lg">
          {hooks.map((hook, i) => (
            <div key={i} className="bg-dark-surface border border-dark-border rounded-lg p-2xl animate-fade-in" style={{ animationDelay: `${0.8 + i * 0.1}s` }}>
              <div className="flex justify-between items-start mb-lg">
                <span className="text-xs font-medium text-accent-lime bg-dark-bg px-md py-sm rounded-full">
                  {hook.style}
                </span>
                <button
                  onClick={() => handleCopyHook(hook.hook)}
                  className="btn-tertiary text-xs"
                >
                  Copy
                </button>
              </div>
              <p className="text-lg font-light mb-lg italic text-text-primary">"{hook.hook}"</p>
              <p className="text-sm text-text-secondary mb-md">{hook.whyItIsStronger}</p>
              <p className="text-xs text-text-tertiary">Based on: {hook.basedOn}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function NextWeekPlanSection({ plan }: any) {
  return (
    <div className="animate-slide-up" style={{ animationDelay: '0.8s' }}>
      <h2 className="text-3xl font-light mb-xl">Here's what I'd post next week</h2>
      <p className="text-text-secondary mb-4xl">An exact creative brief based on your analysis.</p>

      <div className="space-y-4xl">
        <div>
          <p className="text-xs text-text-tertiary mb-md">Video idea</p>
          <p className="text-base leading-relaxed text-text-primary">{plan.videoIdea}</p>
        </div>

        <div>
          <p className="text-xs text-text-tertiary mb-md">Hook (exact opening line)</p>
          <p className="text-lg font-light italic text-accent-lime">"{plan.hook}"</p>
        </div>

        <div>
          <p className="text-xs text-text-tertiary mb-lg">Structure</p>
          <div className="space-y-md">
            {plan.structure.map((step: any, i: number) => (
              <div key={i} className="flex gap-lg">
                <span className="text-sm font-medium text-accent-lime min-w-fit">{step.timeRange}</span>
                <p className="text-sm text-text-secondary">{step.instruction}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-text-tertiary mb-md">Call to action</p>
          <p className="text-base text-text-primary">"{plan.cta}"</p>
        </div>

        <div className="bg-dark-surface border border-accent-lime rounded-lg p-2xl">
          <p className="text-xs text-accent-lime mb-md font-medium">Why this is the right test</p>
          <p className="text-sm text-text-secondary leading-relaxed">{plan.whyThisTest}</p>
        </div>

        <div>
          <p className="text-xs text-text-tertiary mb-md">Primary metric to watch</p>
          <p className="text-base font-medium text-text-primary">{plan.metricToWatch}</p>
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
