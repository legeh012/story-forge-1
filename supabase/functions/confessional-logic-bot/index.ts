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

    const { character, sceneContext, emotionalState } = await req.json();

    console.log(`🎭 Confessional Logic Bot: Generating confessional for ${character.name}`);

    // Get character's confessional settings
    const confessionalSettings = character.metadata?.modules?.castBranding?.confessionalLogic || {
      themes: [],
      triggers: [],
      style: "standard confessional"
    };

    // Build confessional prompt
    const confessionalPrompt = `You are generating a reality TV confessional for ${character.name}.

CHARACTER PROFILE:
- Role: ${character.role}
- Personality: ${character.personality}
- Confessional Style: ${confessionalSettings.style}
- Key Themes: ${confessionalSettings.themes.join(', ')}

SCENE CONTEXT: ${sceneContext}
EMOTIONAL STATE: ${emotionalState}

Generate a powerful confessional moment (2-3 sentences) that:
1. Captures ${character.name}'s unique voice and perspective
2. References the current scene/drama
3. Reveals inner thoughts while maintaining their public persona
4. Includes one quotable "viral moment" line
5. Matches their emotional state: ${emotionalState}

Format as dialogue only, no stage directions.`;

    // Call AI to generate confessional
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert reality TV writer specializing in confessionals.' },
          { role: 'user', content: confessionalPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const confessionalDialogue = aiData.choices[0]?.message?.content || '';

    // Select audio overlay based on emotional state
    const audioTriggers = character.metadata?.modules?.sunoAlbumSync?.audioTriggers || [];
    const audioTrack = audioTriggers.find((track: any) => 
      track.mood === emotionalState || 
      track.relevance.some((r: string) => emotionalState.toLowerCase().includes(r))
    ) || audioTriggers[0];

    const confessional = {
      character: character.name,
      dialogue: confessionalDialogue,
      setting: confessionalSettings.style,
      emotionalState,
      audioOverlay: audioTrack ? {
        title: audioTrack.title,
        mood: audioTrack.mood,
        artist: character.metadata?.modules?.sunoAlbumSync?.artist || character.handle
      } : null,
      visualCues: character.metadata?.modules?.remixArchive?.trainingData?.visualSignature || {},
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Confessional generated with audio overlay: ${audioTrack?.title || 'none'}`);

    return new Response(
      JSON.stringify({
        success: true,
        confessional,
        metadata: {
          character: character.name,
          emotionalState,
          audioTrack: audioTrack?.title
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Confessional Logic Bot error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
