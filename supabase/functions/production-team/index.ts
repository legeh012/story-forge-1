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

    const { role, sceneData, episodeId } = await req.json();

    if (!role || !sceneData) {
      throw new Error('Role and scene data are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    // Define role-specific prompts for REALITY TV production
    const rolePrompts = {
      casting_director: `You are the 22nd century Casting Director AI for REALITY TV. Review this scene for cast consistency and authentic reality TV appeal:

SCENE DATA: ${JSON.stringify(sceneData)}

Analyze for REALITY TV:
1. Character consistency (personality traits, drama patterns, alliance behavior aligned with established reality TV persona?)
2. Casting chemistry (conflict potential, relationship dynamics, antagonist/protagonist balance)
3. Reality TV authenticity (natural reactions, unscripted feel, genuine vulnerability in confessionals)
4. Photorealistic appearance (Netflix-grade production values, no cartoon/anime elements)
5. Cast member archetypes (villain, protagonist, peacemaker, wildcard, etc.)

Return JSON: {
  "consistency": {"characterAlignment": "...", "personalityChecks": [...], "dramaPatternsMatch": true/false},
  "castingChemistry": {"conflictPotential": 9, "allianceDynamics": "...", "antagonistProtagonistBalance": "..."},
  "realityTVAuthenticity": {"unscriptedFeel": true/false, "genuineEmotions": true/false, "confessionalStrength": 8},
  "appearanceNotes": {"photorealistic": true, "netflixGrade": true, "stylingNotes": [...]},
  "castArchetypes": [{"character": "name", "archetype": "villain/protagonist/etc", "reasoning": "..."}],
  "improvements": ["specific casting tweaks for maximum drama"]
}`,

      scene_stylist: `You are the 22nd century Scene Stylist AI for REALITY TV. Apply culturally accurate, on-trend styling for maximum visual impact:

SCENE DATA: ${JSON.stringify(sceneData)}

Style for REALITY TV:
1. Fashion styling (designer pieces, culturally accurate outfits, Instagram-worthy looks, occasion-appropriate luxury)
2. Props and set dressing (upscale locations, authentic cultural details, aspirational lifestyle elements)
3. Cultural authenticity (proper representation, avoid stereotypes, celebrate heritage with style)
4. Reality TV aesthetics (polished but natural, confessional booth styling, branded products placement)
5. Photorealistic rendering notes (fabrics, textures, lighting on skin tones, jewelry details)

Return JSON: {
  "fashion": {
    "characterOutfits": [{"character": "name", "outfit": "designer details", "accessories": [...], "culturalElements": "..."}],
    "styleVibe": "upscale/casual luxury/power dressing",
    "instagramWorthy": true/false
  },
  "props": ["luxury handbags", "champagne flutes", "cultural artifacts", "aspirational lifestyle items"],
  "setDressing": {"location": "...", "atmosphere": "...", "culturalTouches": [...]},
  "culturalNotes": ["authentic representation details", "heritage celebration", "avoid these stereotypes"],
  "realityTVAesthetics": {"polished": true, "natural": true, "confessionalStyling": "..."},
  "renderingNotes": ["fabric textures", "skin tone lighting", "jewelry shine", "hair details"]
}`,

      drama_editor: `You are the 22nd century Drama Editor AI for REALITY TV. Optimize conflict escalation, strategic gameplay, and maximum drama potential:

SCENE DATA: ${JSON.stringify(sceneData)}

Edit for REALITY TV DRAMA:
1. Conflict arc analysis (slow burn vs explosive start, tension escalation points, satisfying payoff)
2. Cliffhanger opportunities (where to cut for "to be continued...", what bombshell to save)
3. Pacing adjustments (when to slow down for emotion, when to speed up for chaos)
4. Hook strength (rate 1-10, will viewers stay tuned?)
5. Reality TV elements:
   - Receipts and evidence deployment timing
   - Alliance betrayal reveals
   - Confessional placement for maximum shade
   - Reaction shot opportunities
   - Strategic gameplay moments

Return JSON: {
  "conflictArc": {
    "buildType": "slow burn/explosive",
    "escalationPoints": [{"timestamp": "...", "trigger": "...", "intensity": 7}],
    "payoff": "satisfying/needs work",
    "dramaticTension": 9
  },
  "cliffhangers": [
    {"cutPoint": "timestamp", "bombshell": "what's about to happen", "viewerHook": "why they'll come back"}
  ],
  "pacing": {
    "slowMoments": ["emotional beat 1", "vulnerable confessional"],
    "fastMoments": ["argument explosion", "alliance reveal"],
    "overallRhythm": "reality TV rollercoaster"
  },
  "hookStrength": 8,
  "realityTVElements": {
    "receiptsDeployment": "when character pulls out evidence",
    "allianceBetrayal": "timing of backstab reveal",
    "confessionalPlacement": ["after shade moment", "during conflict", "post-explosion"],
    "reactionShots": ["character A's face when...", "character B side-eye"],
    "strategicGameplay": "how characters maneuver alliances"
  },
  "improvements": ["specific edits to increase drama", "where to add confessionals", "cliffhanger tweaks"]
}`
    };

    const selectedPrompt = rolePrompts[role as keyof typeof rolePrompts];
    if (!selectedPrompt) {
      throw new Error(`Invalid role: ${role}`);
    }

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
            content: `You are a 22nd century Production Team AI module specializing in ${role.replace('_', ' ')} for REALITY TV. Generate Netflix-grade reality show production with maximum drama and authentic conflict. Think Real Housewives, Selling Sunset, Love & Hip Hop. Always respond with valid JSON.`
          },
          {
            role: 'user',
            content: selectedPrompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`Production Team (${role}) AI error`);
    }

    const aiData = await aiResponse.json();
    const resultText = aiData.choices[0].message.content;
    
    let result;
    try {
      result = JSON.parse(resultText);
    } catch {
      result = { rawOutput: resultText, role };
    }

    // Log execution stats
    if (episodeId) {
      const executionTime = Date.now() - startTime;
      await supabase.from('bot_execution_stats').insert({
        bot_type: 'production_team',
        episode_id: episodeId,
        execution_time_ms: executionTime,
        quality_score: 0.90,
        metadata: { module: role, templatesPreloaded: true }
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        role,
        result,
        message: `Production Team (${role}) analysis complete`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Production Team error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
