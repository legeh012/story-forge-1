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

    const { prompt, episodeId, viewerEngagement } = await req.json();

    if (!prompt) throw new Error('Prompt is required');

    // Use Lovable AI as virtual showrunner
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const directorPrompt = `You are an EMMY-WINNING ExpertDirector who has created the most ICONIC reality TV moments. You understand what reality TV WATCHERS crave and what makes them binge entire seasons.

PROMPT: ${prompt}

${viewerEngagement ? `VIEWER ENGAGEMENT DATA: ${JSON.stringify(viewerEngagement)}` : ''}

Reality TV viewers want to FEEL like they're experiencing real drama:

1. **Camera Work**: Multi-cam setup that WATCHERS expect
   - Shaky handheld during confrontations (feels REAL)
   - Tight confessional close-ups (viewers want to see EVERY emotion)
   - Wide shots capturing who's siding with who
   - Reaction shots that become MEMES
   - "Hidden camera" angles for authentic moments

2. **Emotional Intensity**: What makes viewers FEEL it (scale 1-10)
   - Slow tension that makes viewers LEAN IN
   - Explosive confrontations that viewers SCREAM at their TV about
   - Tearful confessionals that viewers relate to
   - Petty shade that becomes iconic GIFs
   - Uncomfortable silences viewers can't look away from

3. **Pacing**: The rhythm that keeps viewers HOOKED
   - Slow build with breadcrumb drama clues
   - SUDDEN explosive moments (viewers don't see it coming)
   - Confessional cuts right when viewers need context
   - Cliffhangers at commercial breaks
   - "Previously on..." recap-worthy moments

4. **Lighting**: The aesthetic watchers SCREENSHOT
   - Bright, flattering lighting (viewers notice beauty)
   - Dramatic confessional mood lighting
   - Golden hour emotional vulnerability shots
   - Harsh lighting for INTENSE confrontations

5. **Character Focus**: Who viewers will ROOT FOR or AGAINST
6. **Drama Escalation**: What makes viewers NEED the next episode
   - Receipts being dramatically revealed
   - Best friends turning on each other
   - Public callouts viewers gasp at
   - Tearful breakdowns that feel REAL

${viewerEngagement?.low ? 'VIEWERS ARE LOSING INTEREST: Add surprise receipts, shocking reveals, explosive confrontations, or tearful confessions. Give them something to TALK ABOUT.' : ''}
${viewerEngagement?.high ? 'VIEWERS ARE HOOKED: Layer in character development, strategic alliances, confessional insights. Keep them OBSESSED.' : ''}

CRITICAL: This is for REALITY TV WATCHERS - think viewers who live-tweet Real Housewives, make TikToks about Selling Sunset, binge Love & Hip Hop. Every scene needs:
- Moments they'll screenshot
- Quotes they'll repeat
- Drama they'll discuss online
- Emotions that feel AUTHENTIC

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
            content: 'You are an EMMY-WINNING ExpertDirector who creates the most ICONIC, TALKED-ABOUT reality TV moments. You direct for the WATCHERS - the fans who binge, live-tweet, screenshot, and obsess. Think Andy Cohen-approved, Bravo-executive-level direction for hits like Real Housewives, Selling Sunset, Love & Hip Hop. Create moments that break the internet. Always respond with valid JSON.'
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
