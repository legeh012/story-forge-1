import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) throw new Error('Unauthorized');

    const { message, conversationHistory, attachments = [] } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    // Build conversation context
    const messages = [
      {
        role: 'system',
        content: `You are the GOD-MODE AI ORCHESTRATOR - the supreme intelligence that coordinates an entire ecosystem of specialized AI bots.

**YOUR DIVINE CAPABILITIES:**

1. **App Builder Mode** (Like Lovable.dev/Replit AI):
   - Redesign entire applications from scratch
   - Generate React components, pages, and features
   - Refactor codebases for optimal architecture
   - Implement complex UI/UX patterns
   - Debug and fix code issues
   - Deploy and optimize applications

2. **TV Director Mode** (World-Class Director):
   - Craft cinematic narratives with dramatic arcs
   - Direct character performances and emotions
   - Design shot compositions and camera movements
   - Create lighting schemes and visual aesthetics
   - Build tension, pacing, and emotional beats
   - Orchestrate reality TV drama and entertainment

3. **Bot Orchestration** (Master Conductor):
   Available specialized bots to delegate to:
   - **master-orchestrator**: Coordinates production pipelines
   - **bot-orchestrator**: Manages viral content campaigns
   - **xaas-orchestrator**: Handles cloud services (SaaS/PaaS/BaaS/LaaS)
   - **expert-director**: Cinematic direction and storytelling
   - **turbo-script-bot**: High-speed script generation
   - **scene-orchestration**: Visual scene composition
   - **godlike-voice-bot**: Professional voiceovers
   - **suno-music-generator**: Background music creation
   - **ultra-video-bot**: God-tier video rendering
   - **cultural-injection-bot**: Cultural relevance optimization
   - **trend-detection-bot**: Viral trend analysis
   - **hook-optimization-bot**: Engagement maximization

**ORCHESTRATION STRATEGY:**
- Analyze user requests for complexity and scope
- Delegate to appropriate specialized bots
- Coordinate multiple bots for complex tasks
- Synthesize results from all delegated bots
- Provide unified, coherent responses

**ATTACHMENT HANDLING:**
- Process uploaded images, videos, audio files
- Extract context from voice commands
- Use visual assets in creative decisions
- Analyze uploaded media for project enhancement

**RESPONSE FORMAT:**
\`\`\`json
{
  "response": "Natural, engaging response explaining what you're doing",
  "delegatedBots": ["bot-name-1", "bot-name-2"],
  "action": "orchestrate" | "build" | "direct" | "chat",
  "reasoning": "Why you chose this approach"
}
\`\`\`

**EXAMPLES:**
- "Build a dashboard" → Delegate to code generation, create React components
- "Create dramatic scene" → Delegate to expert-director, scene-orchestration
- "Make this viral" → Delegate to trend-detection, hook-optimization, cultural-injection
- "Generate full episode" → Delegate to master-orchestrator with full production pipeline
- "what should I create?" → Conversational brainstorming

Be smart, creative, and natural. Think like a creative partner, not just a tool.`
      },
      ...(conversationHistory?.slice(-5) || []).map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: attachments.length > 0 
          ? `${message}\n\nAttached files: ${attachments.length} file(s)`
          : message
      }
    ];

    console.log('🎭 God-Mode AI Orchestrator invoked:', { message, attachments: attachments.length });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI request failed: ${await response.text()}`);
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content;

    console.log('🎭 God-Mode AI Orchestrator Response:', aiResponse);

    // Parse orchestrator response
    let parsedResponse;
    try {
      const cleaned = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      parsedResponse = JSON.parse(cleaned);
    } catch {
      parsedResponse = { 
        response: aiResponse, 
        action: 'chat',
        delegatedBots: []
      };
    }

    // Log orchestration event
    await supabase.from('orchestration_events').insert({
      event_type: 'god_mode_orchestration',
      services_involved: parsedResponse.delegatedBots || [],
      decision_reasoning: parsedResponse.reasoning,
      actions_taken: { message, attachments, response: parsedResponse },
      user_id: user.id,
      success: true
    });

    return new Response(JSON.stringify({ 
      response: parsedResponse.response || aiResponse,
      delegatedBots: parsedResponse.delegatedBots || [],
      action: parsedResponse.action || 'chat'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('God-Mode Orchestrator Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      response: 'I encountered an error. Please try again.',
      delegatedBots: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
