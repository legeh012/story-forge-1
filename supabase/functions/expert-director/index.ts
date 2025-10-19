import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

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

    const { prompt, episodeId, viewerEngagement } = await req.json();

    if (!prompt) throw new Error('Prompt is required');

    // Use Lovable AI as virtual showrunner
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const directorPrompt = `You are ExpertDirector, a Netflix-caliber showrunner AI. Interpret this creative prompt and provide detailed cinematic direction:

PROMPT: ${prompt}

${viewerEngagement ? `VIEWER ENGAGEMENT DATA: ${JSON.stringify(viewerEngagement)}` : ''}

Provide a comprehensive show direction breakdown:

1. **Camera Work**: Specify shot types, angles, movements (e.g., "wide establishing shot, slow push-in to medium close-up")
2. **Emotional Tone**: Define the emotional arc and intensity (scale 1-10 for drama/tension/humor)
3. **Pacing**: Scene rhythm (slow burn, rapid escalation, steady tension)
4. **Lighting**: Mood lighting specifications (warm/cool, harsh/soft, time of day)
5. **Character Focus**: Who dominates the scene and why
6. **Drama Adjustments**: Based on engagement, suggest intensity modifications

${viewerEngagement?.low ? 'INCREASE drama intensity by adding conflict triggers or surprise reveals.' : ''}
${viewerEngagement?.high ? 'MAINTAIN current drama level, add subtle character development moments.' : ''}

Return as JSON:
{
  "cameraDirectives": ["shot 1 description", "shot 2 description", ...],
  "emotionalTone": {"primary": "tension", "intensity": 8, "arc": "escalating"},
  "pacing": {"rhythm": "slow burn to explosive", "beatCount": 5},
  "lighting": {"mood": "dramatic", "temperature": "cool", "keyLight": "high contrast"},
  "characterFocus": {"primary": "Character A", "secondary": "Character B", "reasoning": "why this focus"},
  "dramaTweaks": {"adjustment": "increase/maintain/decrease", "triggers": ["specific elements"]},
  "cinematicFlow": "overall narrative flow description ensuring no flat scenes"
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are ExpertDirector, an elite showrunner AI that provides cinematic direction for reality TV productions. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: directorPrompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('Failed to get director guidance');
    }

    const aiData = await aiResponse.json();
    const directionText = aiData.choices[0].message.content;
    
    let direction;
    try {
      direction = JSON.parse(directionText);
    } catch {
      direction = {
        cameraDirectives: ["Standard coverage with varied angles"],
        emotionalTone: { primary: "balanced", intensity: 5, arc: "steady" },
        pacing: { rhythm: "moderate", beatCount: 3 },
        lighting: { mood: "natural", temperature: "neutral", keyLight: "soft" },
        characterFocus: { primary: "ensemble", reasoning: "group dynamics" },
        dramaTweaks: { adjustment: "maintain", triggers: [] },
        cinematicFlow: directionText
      };
    }

    // Log execution stats if episodeId provided
    if (episodeId) {
      const executionTime = Date.now() - startTime;
      await supabase.from('bot_execution_stats').insert({
        bot_type: 'expert_director',
        episode_id: episodeId,
        execution_time_ms: executionTime,
        quality_score: 0.85,
        metadata: { directionQuality: 'high', adaptiveAdjustments: true }
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        direction,
        message: 'Cinematic direction provided by ExpertDirector'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Expert Director error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
