import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface GeneratedHook {
  style: string
  hook: string
  whyItIsStronger: string
  basedOn: string
}

interface HookGenerationResponse {
  success: boolean
  hooks?: GeneratedHook[]
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<HookGenerationResponse>> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const {
      currentHook,
      strongHook,
      weakTopic,
      strongTopic,
      weakFormat,
      strongFormat,
      primaryGoal,
      biggestInsight,
      watchPercentageDifference,
      engagementDifference,
    } = body

    if (!currentHook || !strongTopic) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const prompt = `You are a content coaching expert. Generate exactly three stronger hook alternatives for a TikTok creator.

Current weak hook: "${currentHook}"
Strong video hook: "${strongHook}"
Creator's goal: ${primaryGoal}
Video topic: ${weakTopic}
Video format: ${weakFormat}

Key insight from analysis: ${biggestInsight}
Watch time difference: ${watchPercentageDifference}
Engagement difference: ${engagementDifference}

Generate exactly 3 hooks with different psychological approaches:
1. Curiosity-based (leave the audience wondering)
2. Contrarian or pattern-interruption (challenge assumptions)
3. Story or outcome-first (lead with the result)

For each hook, return ONLY valid JSON (no markdown, no extra text):
{
  "hooks": [
    {
      "style": "Curiosity",
      "hook": "exact opening line",
      "whyItIsStronger": "concise explanation tied to the data",
      "basedOn": "reference to the analytics"
    },
    {
      "style": "Contrarian",
      "hook": "exact opening line",
      "whyItIsStronger": "concise explanation",
      "basedOn": "reference to the analytics"
    },
    {
      "style": "Story",
      "hook": "exact opening line",
      "whyItIsStronger": "concise explanation",
      "basedOn": "reference to the analytics"
    }
  ]
}

Requirements:
- Each hook must be speakable in 2-3 seconds
- Do NOT use generic hooks ("Have you ever wondered...")
- DO use specific details from the analysis
- Do NOT invent facts about the creator
- Hooks must be grounded in the actual video topic and format
- Each style must have a genuinely different approach`

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!anthropicResponse.ok) {
      const error = await anthropicResponse.json()
      console.error('Anthropic API error:', error)
      return NextResponse.json(
        { success: false, error: 'Hook generation failed' },
        { status: 500 }
      )
    }

    const data = await anthropicResponse.json()
    const claudeText = data.content?.[0]?.text || ''

    if (!claudeText) {
      return NextResponse.json(
        { success: false, error: 'Invalid response from model' },
        { status: 500 }
      )
    }

    // Parse JSON response
    let parsed
    try {
      parsed = JSON.parse(claudeText)
    } catch (e) {
      console.error('Failed to parse hook response:', claudeText)
      return NextResponse.json(
        { success: false, error: 'Could not parse generated hooks' },
        { status: 500 }
      )
    }

    if (!parsed.hooks || !Array.isArray(parsed.hooks) || parsed.hooks.length !== 3) {
      console.error('Invalid hooks response:', parsed)
      return NextResponse.json(
        { success: false, error: 'Generated hooks do not match expected format' },
        { status: 500 }
      )
    }

    // Validate each hook
    const validHooks = parsed.hooks.every(
      (h: any) => h.style && h.hook && h.whyItIsStronger && h.basedOn
    )

    if (!validHooks) {
      return NextResponse.json(
        { success: false, error: 'One or more hooks are incomplete' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, hooks: parsed.hooks },
      { status: 200 }
    )
  } catch (err) {
    console.error('Hook generation error:', err)
    return NextResponse.json(
      { success: false, error: 'Hook generation failed' },
      { status: 500 }
    )
  }
}
