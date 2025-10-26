import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EpisodeRequest {
  prompt: string;
  projectId: string;
  duration?: number;
  style?: 'dramatic' | 'comedic' | 'tense' | 'romantic';
}

const sayWalahiCharacters = [
  { name: 'Lucky', personality: 'charismatic leader, smooth talker', traits: 'confident, strategic' },
  { name: 'Luul', personality: 'dramatic queen, loves attention', traits: 'bold, expressive' },
  { name: 'Samara', personality: 'peace keeper, voice of reason', traits: 'diplomatic, caring' },
  { name: 'Ayaan', personality: 'troublemaker, stirrer of drama', traits: 'mischievous, witty' },
  { name: 'Hani', personality: 'loyal friend, protective', traits: 'fierce, honest' },
  { name: 'Zahra', personality: 'gossip master, knows everything', traits: 'observant, social' },
  { name: 'Nasra', personality: 'mysterious, reserved', traits: 'thoughtful, deep' },
  { name: 'Amal', personality: 'comic relief, always joking', traits: 'funny, light-hearted' }
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { prompt, projectId, duration = 30, style = 'dramatic' }: EpisodeRequest = await req.json();

    console.log('Generating Say Walahi episode:', { prompt, projectId, duration, style });

    // Generate episode script using AI
    const aiGatewayUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const scriptResponse = await fetch(aiGatewayUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [{
          role: 'user',
          content: `Generate a ${style} reality TV episode script for "Say Walahi" based on this prompt: "${prompt}"

Available characters:
${sayWalahiCharacters.map(c => `- ${c.name}: ${c.personality} (${c.traits})`).join('\n')}

Create exactly ${Math.ceil(duration / 5)} scenes, each 5 seconds long.
For each scene provide:
1. Scene number
2. Characters involved (2-4 characters)
3. Location (luxury mansion, rooftop lounge, poolside, etc.)
4. Action/dialogue (dramatic, reality TV style)
5. Camera movement (zoom, pan, dramatic close-up)
6. Visual description for image generation

Format as JSON array with this structure:
[{
  "sceneNumber": 1,
  "characters": ["Lucky", "Luul"],
  "location": "string",
  "dialogue": "string",
  "action": "string",
  "cameraMovement": "string",
  "visualDescription": "detailed description for photorealistic image generation",
  "duration": 5
}]

Make it DRAMATIC and VIRAL-WORTHY! Think BET/VH1 reality show energy.`
        }],
        response_format: { type: 'json_object' }
      })
    });

    const scriptData = await scriptResponse.json();
    const scenes = JSON.parse(scriptData.choices[0].message.content).scenes;

    console.log(`Generated ${scenes.length} scenes`);

    // Generate images for each scene
    const frames = [];
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      console.log(`Generating image for scene ${i + 1}/${scenes.length}`);

      const imagePrompt = `PHOTOREALISTIC REALITY TV SCENE:
${scene.visualDescription}

Characters: ${scene.characters.join(', ')}
Location: ${scene.location}
Style: Ultra-realistic, Netflix-grade cinematography, dramatic lighting
Camera: ${scene.cameraMovement}

Requirements:
- Photorealistic human features
- Professional reality TV cinematography
- Dramatic lighting and composition
- 4K quality, cinematic color grading
- Natural expressions and body language`;

      const imageResponse = await fetch(aiGatewayUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [{
            role: 'user',
            content: imagePrompt
          }],
          modalities: ['image', 'text']
        })
      });

      const imageData = await imageResponse.json();
      const imageBase64 = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageBase64) {
        throw new Error(`Failed to generate image for scene ${i + 1}`);
      }

      // Upload to storage
      const imageBuffer = Uint8Array.from(atob(imageBase64.split(',')[1]), c => c.charCodeAt(0));
      const imagePath = `episodes/${projectId}/scene_${i + 1}_${Date.now()}.png`;
      
      const { error: uploadError } = await supabase.storage
        .from('episode-videos')
        .upload(imagePath, imageBuffer, { contentType: 'image/png' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('episode-videos')
        .getPublicUrl(imagePath);

      frames.push({
        sceneNumber: scene.sceneNumber,
        image: publicUrl,
        duration: scene.duration,
        dialogue: scene.dialogue,
        characters: scene.characters,
        cameraMovement: scene.cameraMovement
      });
    }

    // Create video manifest
    const manifest = {
      episodeId: projectId,
      totalDuration: duration,
      frames: frames,
      metadata: {
        style: style,
        prompt: prompt,
        generatedAt: new Date().toISOString(),
        charactersUsed: [...new Set(scenes.flatMap((s: any) => s.characters))]
      }
    };

    // Upload manifest
    const manifestPath = `episodes/${projectId}/manifest_${Date.now()}.json`;
    const { error: manifestError } = await supabase.storage
      .from('episode-videos')
      .upload(manifestPath, JSON.stringify(manifest, null, 2), { contentType: 'application/json' });

    if (manifestError) throw manifestError;

    const { data: { publicUrl: manifestUrl } } = supabase.storage
      .from('episode-videos')
      .getPublicUrl(manifestPath);

    // Create episode record
    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .insert({
        project_id: projectId,
        title: `Say Walahi: ${prompt.slice(0, 50)}`,
        synopsis: prompt,
        video_status: 'manifest_ready',
        video_manifest_url: manifestUrl,
        storyboard: scenes,
        metadata: manifest.metadata
      })
      .select()
      .single();

    if (episodeError) throw episodeError;

    console.log('Episode created:', episode.id);

    return new Response(JSON.stringify({
      success: true,
      episode: episode,
      manifestUrl: manifestUrl,
      scenesGenerated: scenes.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error generating episode:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
