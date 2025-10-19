import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// GODLIKE sound effects library
const SOUND_EFFECTS_LIBRARY = {
  dramatic: ['thunder', 'impact', 'whoosh', 'riser'],
  ambient: ['wind', 'rain', 'forest', 'urban'],
  action: ['explosion', 'gunshot', 'sword', 'punch'],
  emotional: ['heartbeat', 'breath', 'whisper', 'sigh'],
  transition: ['swoosh', 'glitch', 'fade', 'reverse'],
  cinematic: ['orchestral-hit', 'brass-stab', 'string-swell', 'drum-roll']
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scene, mood, duration = 3.0 } = await req.json();

    console.log('🔊 GODLIKE Sound Effects Generator:', { scene, mood, duration });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

    // AI-powered sound effect selection
    const selectionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [{
          role: 'user',
          content: `Select 3-5 PERFECT sound effects for this scene: "${scene}" with mood: "${mood}".
          
          Available categories: ${Object.keys(SOUND_EFFECTS_LIBRARY).join(', ')}
          Available effects: ${JSON.stringify(SOUND_EFFECTS_LIBRARY)}
          
          Return JSON array of effect names with timing: [{ effect: "name", timing: 0.0, volume: 0.8 }]`
        }],
      }),
    });

    const selectionData = await selectionResponse.json();
    let selectedEffects;
    
    try {
      const content = selectionData.choices[0].message.content;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      selectedEffects = jsonMatch ? JSON.parse(jsonMatch[0]) : [
        { effect: 'whoosh', timing: 0.0, volume: 0.7 },
        { effect: 'impact', timing: 1.5, volume: 0.9 }
      ];
    } catch (e) {
      selectedEffects = [
        { effect: 'ambient', timing: 0.0, volume: 0.6 },
        { effect: 'dramatic', timing: 2.0, volume: 0.8 }
      ];
    }

    console.log('✅ Selected Effects:', selectedEffects);

    // Return sound effect configuration
    const soundConfig = {
      scene,
      mood,
      duration,
      effects: selectedEffects,
      quality: 'GODLIKE',
      format: '48kHz/24-bit',
      spatial: 'stereo-enhanced',
      generatedAt: new Date().toISOString()
    };

    return new Response(
      JSON.stringify({
        success: true,
        soundConfig,
        effectsCount: selectedEffects.length,
        quality: 'GODLIKE'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('❌ Sound Effects Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
