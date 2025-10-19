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

    // Define role-specific prompts
    const rolePrompts = {
      casting_director: `You are the Casting Director AI. Review this scene and ensure character consistency and realism:

SCENE DATA: ${JSON.stringify(sceneData)}

Provide:
1. Character consistency check (are traits, appearance, behavior aligned with established persona?)
2. Realism assessment (natural dialogue, believable reactions, photorealistic appearance notes)
3. Casting improvements (if any inconsistencies found)

Return JSON: {"consistency": {...}, "realism": {...}, "improvements": [...]}`,

      scene_stylist: `You are the Scene Stylist AI. Apply culturally accurate styling to this scene:

SCENE DATA: ${JSON.stringify(sceneData)}

Provide:
1. Fashion styling (culturally accurate outfits for each character based on setting/occasion)
2. Props and set dressing (authentic details for the location)
3. Cultural authenticity notes (ensure proper representation)

Return JSON: {"fashion": {...}, "props": [...], "culturalNotes": [...]}`,

      drama_editor: `You are the Drama Editor AI. Optimize conflict arcs and cliffhangers:

SCENE DATA: ${JSON.stringify(sceneData)}

Provide:
1. Conflict arc analysis (is tension building properly?)
2. Cliffhanger opportunities (where to cut for maximum suspense)
3. Pacing adjustments (tighten or expand specific beats)
4. Hook strength (rate 1-10 and suggest improvements)

Return JSON: {"conflictArc": {...}, "cliffhangers": [...], "pacing": {...}, "hookStrength": 7}`
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
            content: `You are a Production Team AI module specializing in ${role.replace('_', ' ')}. Always respond with valid JSON.`
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
