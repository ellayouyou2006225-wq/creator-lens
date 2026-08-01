/**
 * app/api/extract/route.ts
 * Server-side only. API key never exposed to client.
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface ExtractedMetric {
  value: number | null
  originalText: string | null
  confidence: 'high' | 'medium' | 'low'
}

interface ExtractionResponse {
  success: boolean
  metrics: {
    views: ExtractedMetric
    likes: ExtractedMetric
    comments: ExtractedMetric
    shares: ExtractedMetric
    saves: ExtractedMetric
    videoLengthSeconds: ExtractedMetric
    averageWatchTimeSeconds: ExtractedMetric
    completionRate: ExtractedMetric
    newFollowers: ExtractedMetric
  }
  error?: string
  warnings?: string[]
}

/**
 * Normalize values: convert "1.2K" → 1200, "45%" → 45, "1m 30s" → 90
 */
function normalizeValue(
  text: string | null,
  fieldName: string
): { value: number | null; originalText: string | null; confidence: 'high' | 'medium' | 'low' } {
  if (!text || text.trim() === '' || text.toLowerCase() === 'n/a' || text === '--') {
    return { value: null, originalText: text, confidence: 'low' }
  }

  const original = text.trim()
  let numStr = original.toLowerCase()

  // Handle percentages
  if (numStr.includes('%')) {
    const num = parseFloat(numStr.replace('%', '').trim())
    if (!isNaN(num)) {
      return { value: num, originalText: original, confidence: 'high' }
    }
  }

  // Handle K values (e.g., "1.2K" → 1200)
  if (numStr.includes('k')) {
    const num = parseFloat(numStr.replace('k', '').trim())
    if (!isNaN(num)) {
      return { value: Math.round(num * 1000), originalText: original, confidence: 'high' }
    }
  }

  // Handle M values (e.g., "1.5M" → 1500000)
  if (numStr.includes('m') && !numStr.includes('min') && !numStr.includes('avg')) {
    const num = parseFloat(numStr.replace('m', '').trim())
    if (!isNaN(num)) {
      return { value: Math.round(num * 1000000), originalText: original, confidence: 'high' }
    }
  }

  // Handle time durations (e.g., "1m 30s" → 90, "45s" → 45)
  if (fieldName.includes('Time') || fieldName.includes('Seconds')) {
    const secondsMatch = numStr.match(/(\d+)\s*s(?:ec)?/i)
    const minutesMatch = numStr.match(/(\d+)\s*m(?:in)?/i)

    let totalSeconds = 0
    if (minutesMatch) totalSeconds += parseInt(minutesMatch[1]) * 60
    if (secondsMatch) totalSeconds += parseInt(secondsMatch[1])

    if (totalSeconds > 0) {
      return { value: totalSeconds, originalText: original, confidence: 'high' }
    }
  }

  // Try plain number
  const num = parseFloat(numStr.replace(/[^0-9.]/g, ''))
  if (!isNaN(num) && num >= 0) {
    return { value: Math.round(num), originalText: original, confidence: 'high' }
  }

  return { value: null, originalText: original, confidence: 'low' }
}

/**
 * Extract metrics from Claude Vision response
 */
function parseClaudeResponse(responseText: string): ExtractionResponse['metrics'] {
  const fields = {
    views: null,
    likes: null,
    comments: null,
    shares: null,
    saves: null,
    videoLengthSeconds: null,
    averageWatchTimeSeconds: null,
    completionRate: null,
    newFollowers: null,
  }

  // Parse JSON if Claude returned it
  try {
    const parsed = JSON.parse(responseText)
    const result: ExtractionResponse['metrics'] = {
      views: { value: null, originalText: null, confidence: 'low' },
      likes: { value: null, originalText: null, confidence: 'low' },
      comments: { value: null, originalText: null, confidence: 'low' },
      shares: { value: null, originalText: null, confidence: 'low' },
      saves: { value: null, originalText: null, confidence: 'low' },
      videoLengthSeconds: { value: null, originalText: null, confidence: 'low' },
      averageWatchTimeSeconds: { value: null, originalText: null, confidence: 'low' },
      completionRate: { value: null, originalText: null, confidence: 'low' },
      newFollowers: { value: null, originalText: null, confidence: 'low' },
    }

    // Map parsed values to results
    if (parsed.views !== undefined) result.views = normalizeValue(String(parsed.views), 'views')
    if (parsed.likes !== undefined) result.likes = normalizeValue(String(parsed.likes), 'likes')
    if (parsed.comments !== undefined) result.comments = normalizeValue(String(parsed.comments), 'comments')
    if (parsed.shares !== undefined) result.shares = normalizeValue(String(parsed.shares), 'shares')
    if (parsed.saves !== undefined) result.saves = normalizeValue(String(parsed.saves), 'saves')
    if (parsed.videoLengthSeconds !== undefined)
      result.videoLengthSeconds = normalizeValue(String(parsed.videoLengthSeconds), 'videoLengthSeconds')
    if (parsed.averageWatchTimeSeconds !== undefined)
      result.averageWatchTimeSeconds = normalizeValue(String(parsed.averageWatchTimeSeconds), 'averageWatchTimeSeconds')
    if (parsed.completionRate !== undefined)
      result.completionRate = normalizeValue(String(parsed.completionRate), 'completionRate')
    if (parsed.newFollowers !== undefined)
      result.newFollowers = normalizeValue(String(parsed.newFollowers), 'newFollowers')

    return result
  } catch (e) {
    // Fallback: return empty metrics
    return {
      views: { value: null, originalText: null, confidence: 'low' },
      likes: { value: null, originalText: null, confidence: 'low' },
      comments: { value: null, originalText: null, confidence: 'low' },
      shares: { value: null, originalText: null, confidence: 'low' },
      saves: { value: null, originalText: null, confidence: 'low' },
      videoLengthSeconds: { value: null, originalText: null, confidence: 'low' },
      averageWatchTimeSeconds: { value: null, originalText: null, confidence: 'low' },
      completionRate: { value: null, originalText: null, confidence: 'low' },
      newFollowers: { value: null, originalText: null, confidence: 'low' },
    }
  }
}

/**
 * Main extraction handler
 */
export async function POST(request: NextRequest): Promise<NextResponse<ExtractionResponse>> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          metrics: {} as any,
          error: 'API key not configured',
        },
        { status: 500 }
      )
    }

    // Parse FormData
    const formData = await request.formData()
    const file = formData.get('screenshot') as File | null

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          metrics: {} as any,
          error: 'No screenshot uploaded',
        },
        { status: 400 }
      )
    }

    // Validate file type
    const supportedTypes = ['image/png', 'image/jpeg', 'image/webp']
    if (!supportedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          metrics: {} as any,
          error: `Unsupported file type. Supported: PNG, JPG, JPEG, WEBP`,
        },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          metrics: {} as any,
          error: 'File too large. Max 10MB.',
        },
        { status: 400 }
      )
    }

    // Convert file to base64
    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    // Call Anthropic API (server-side only)
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-1',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: file.type === 'image/jpeg' ? 'image/jpeg' : (file.type as any),
                  data: base64,
                },
              },
              {
                type: 'text',
                text: `Extract TikTok/Instagram analytics from this screenshot. Return ONLY a JSON object (no other text) with these exact fields. Use null for any metric you cannot read. Never invent values.

{
  "views": <number or null>,
  "likes": <number or null>,
  "comments": <number or null>,
  "shares": <number or null>,
  "saves": <number or null>,
  "videoLengthSeconds": <number or null>,
  "averageWatchTimeSeconds": <number or null>,
  "completionRate": <number 0-100 or null>,
  "newFollowers": <number or null>
}

Normalization rules:
- Convert "1.2K" to 1200
- Convert "1.5M" to 1500000
- Convert "45%" to 45
- Convert "1m 30s" to 90 seconds
- Return null if the metric is not visible`,
              },
            ],
          },
        ],
      }),
    })

    if (!anthropicResponse.ok) {
      const error = await anthropicResponse.json()
      console.error('Anthropic API error:', error)
      console.error('API Key present:', !!apiKey)
      console.error('API Key starts with:', apiKey?.substring(0, 10))
      return NextResponse.json(
        {
          success: false,
          metrics: {} as any,
          error: 'Claude API call failed: ' + (error.error?.message || 'Unknown error'),
        },
        { status: 500 }
      )
    }

    const data = await anthropicResponse.json()
    const claudeText = data.content?.[0]?.text || ''

    if (!claudeText) {
      return NextResponse.json(
        {
          success: false,
          metrics: {} as any,
          error: 'Invalid model response',
        },
        { status: 500 }
      )
    }

    const metrics = parseClaudeResponse(claudeText)

    // Check for missing metrics
    const warnings: string[] = []
    if (metrics.views.value === null) warnings.push('Views not detected')
    if (metrics.likes.value === null) warnings.push('Likes not detected')
    if (metrics.videoLengthSeconds.value === null) warnings.push('Video length not detected')

    return NextResponse.json(
      {
        success: true,
        metrics,
        warnings: warnings.length > 0 ? warnings : undefined,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('Extraction error:', err)
    return NextResponse.json(
      {
        success: false,
        metrics: {} as any,
        error: 'Extraction failed. Please try again.',
      },
      { status: 500 }
    )
  }
}
