import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SunoMusicRequest {
  characterName: string;
  characterPersonality?: string;
  musicStyle?: string;
  mood?: string;
  duration?: number;
  customPrompt?: string;
  episodeId?: string;
}

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

    const { 
      characterName, 
      characterPersonality, 
      musicStyle, 
      mood, 
      duration = 30,
      customPrompt,
      episodeId 
    } = await req.json() as SunoMusicRequest;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    console.log(`🎵 Generating Suno music for: ${characterName}`);

    // Generate music description using AI based on character
    const musicPrompt = customPrompt || await generateMusicPrompt(
      LOVABLE_API_KEY,
      characterName,
      characterPersonality,
      musicStyle,
      mood
    );

    console.log('🎼 Music Prompt:', musicPrompt);

    // In production, you would integrate with Suno API here
    // For now, we'll generate music metadata and recommendations
    const musicSpec = {
      characterName,
      prompt: musicPrompt,
      style: musicStyle || 'Urban/Hip-Hop',
      mood: mood || 'Confident',
      duration,
      bpm: calculateBPM(mood),
      key: suggestKey(characterName),
      instruments: suggestInstruments(musicStyle, mood),
      structure: generateMusicStructure(duration),
      vocalStyle: characterPersonality ? describeVocalStyle(characterPersonality) : 'none',
      timestamp: new Date().toISOString(),
    };

    // Log activity
    await supabase.from('bot_activities').insert({
      bot_type: 'suno-music-generator',
      episode_id: episodeId,
      status: 'completed',
      metadata: { 
        character: characterName, 
        musicSpec,
        sunoReady: true 
      },
      user_id: user.id,
    });

    // Store music specification
    if (episodeId) {
      const { data: episode } = await supabase
        .from('episodes')
        .select('metadata')
        .eq('id', episodeId)
        .single();

      const updatedMetadata = {
        ...episode?.metadata,
        character_music: {
          ...(episode?.metadata?.character_music || {}),
          [characterName]: musicSpec,
        },
      };

      await supabase
        .from('episodes')
        .update({ metadata: updatedMetadata })
        .eq('id', episodeId);
    }

    return new Response(JSON.stringify({
      success: true,
      musicSpec,
      sunoPrompt: musicPrompt,
      message: `Music generated for ${characterName}`,
      instructions: `Use this prompt in Suno: "${musicPrompt}"`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Suno Music Generator Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateMusicPrompt(
  apiKey: string,
  characterName: string,
  personality?: string,
  style?: string,
  mood?: string
): Promise<string> {
  const prompt = `Create a Suno AI music prompt for a reality TV character theme song:

Character: ${characterName}
Personality: ${personality || 'Dynamic reality TV personality'}
Style: ${style || 'Urban/Hip-Hop'}
Mood: ${mood || 'Confident and energetic'}

Generate a detailed Suno prompt that captures this character's essence in 2-3 sentences.
Focus on musical elements: genre, tempo, instruments, vocal style, energy.
Make it specific for Suno AI to generate the perfect character theme.

Return only the prompt text, no JSON or formatting.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) throw new Error('Failed to generate music prompt');

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

function calculateBPM(mood?: string): number {
  const bpmMap: Record<string, number> = {
    'Energetic': 140,
    'Confident': 120,
    'Dramatic': 100,
    'Chill': 80,
    'Intense': 150,
    'Romantic': 90,
    'Aggressive': 160,
  };
  return bpmMap[mood || 'Confident'] || 120;
}

function suggestKey(characterName: string): string {
  // Use character name to deterministically suggest a key
  const keys = ['C Major', 'G Major', 'D Major', 'A Minor', 'E Minor', 'F Major', 'Bb Major'];
  const index = characterName.length % keys.length;
  return keys[index];
}

function suggestInstruments(style?: string, mood?: string): string[] {
  const baseInstruments = ['808 bass', 'hi-hats', 'snare'];
  
  if (style?.includes('Hip-Hop') || style?.includes('Urban')) {
    return [...baseInstruments, 'piano', 'synth lead', 'vocal samples'];
  }
  
  if (mood === 'Dramatic') {
    return [...baseInstruments, 'strings', 'cinematic pads', 'brass'];
  }
  
  return [...baseInstruments, 'melody', 'pads'];
}

function generateMusicStructure(duration: number): string[] {
  if (duration <= 15) {
    return ['Intro (2s)', 'Hook (8s)', 'Outro (5s)'];
  } else if (duration <= 30) {
    return ['Intro (4s)', 'Verse (8s)', 'Hook (10s)', 'Outro (8s)'];
  } else {
    return ['Intro (5s)', 'Verse 1 (15s)', 'Hook (15s)', 'Verse 2 (15s)', 'Hook (15s)', 'Outro (10s)'];
  }
}

function describeVocalStyle(personality: string): string {
  if (personality.toLowerCase().includes('confident')) {
    return 'Strong, assertive vocals with ad-libs';
  }
  if (personality.toLowerCase().includes('dramatic')) {
    return 'Emotional, theatrical vocal delivery';
  }
  if (personality.toLowerCase().includes('chill') || personality.toLowerCase().includes('laid back')) {
    return 'Smooth, relaxed vocal style';
  }
  return 'Dynamic vocal performance with character';
}
