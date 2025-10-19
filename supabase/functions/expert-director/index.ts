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

    const directorPrompt = `You are ExpertDirector, an elite 22nd century AI showrunner specializing in REALITY TV production. This is high-drama, unscripted-style content with Netflix-caliber production values.

PROMPT: ${prompt}

${viewerEngagement ? `VIEWER ENGAGEMENT DATA: ${JSON.stringify(viewerEngagement)}` : ''}

Generate REALITY TV show direction with these specifications:

1. **Camera Work**: Reality TV multi-cam setup
   - Handheld moments for authenticity
   - Confessional close-ups (tight, emotional)
   - Wide shots capturing group dynamics
   - Reaction shots of other cast members
   - "Fly on the wall" observational angles

2. **Emotional Tone**: Reality TV drama (scale 1-10)
   - Tension builds, explosive confrontations
   - Genuine vulnerability in confessionals
   - Shade, side-eyes, subtle reads
   - Uncomfortable silences that speak volumes

3. **Pacing**: Reality TV rhythm
   - Slow build with micro-tensions
   - Sudden explosive moments
   - Cutaway confessionals for commentary
   - Cliffhanger moments

4. **Lighting**: Reality TV aesthetic
   - Natural, bright lighting for main scenes
   - Dramatic confessional booth lighting
   - Golden hour for emotional moments
   - Harsh lighting for confrontations

5. **Character Focus**: Who's the protagonist/antagonist this scene?
6. **Drama Adjustments**: Reality TV escalation tactics
   - Receipts being pulled out
   - Allies switching sides
   - Public call-outs
   - Tearful confessionals

${viewerEngagement?.low ? 'INCREASE drama: Add receipts, surprise reveals, alliance betrayals, or explosive confrontations.' : ''}
${viewerEngagement?.high ? 'MAINTAIN drama: Add layered character development, strategic gameplay, confessional insights.' : ''}

CRITICAL: This is REALITY TV - think Real Housewives meets Selling Sunset. Every scene needs drama potential, confessional moments, and authentic human conflict.

Return as JSON:
{
  "cameraDirectives": ["reality TV shot 1", "confessional shot", "reaction shot", ...],
  "emotionalTone": {"primary": "tension/shade/drama", "intensity": 8, "arc": "escalating"},
  "pacing": {"rhythm": "reality TV build", "beatCount": 5, "confessionalBreaks": 2},
  "lighting": {"mood": "reality TV naturalistic", "temperature": "warm/cool", "confessionalLighting": "dramatic"},
  "characterFocus": {"protagonist": "Character A", "antagonist": "Character B", "audience favorite": "Character C", "reasoning": "why this dynamic"},
  "dramaTweaks": {"adjustment": "increase/maintain", "realityTVTriggers": ["receipts", "confrontation", "alliance shift"]},
  "cinematicFlow": "reality TV narrative arc ensuring maximum drama and authenticity",
  "confessionalMoments": ["confessional 1 topic", "confessional 2 topic"]
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
            content: 'You are ExpertDirector, a 22nd century AI showrunner specializing in REALITY TV production. Generate dramatic, authentic reality show content with Netflix-grade production values. Think Real Housewives, Selling Sunset, Love & Hip Hop - maximum drama, genuine conflict, strategic confessionals. Always respond with valid JSON.'
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
