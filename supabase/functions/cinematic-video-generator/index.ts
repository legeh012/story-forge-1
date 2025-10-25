import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Scene {
  scene_number: number;
  description: string;
  dialogue: string;
  characters: string[];
  duration: number;
  camera_movement: string;
  setting: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { episodeId, quality = 'cinematic' } = await req.json();
    console.log('Generating cinematic video for episode:', episodeId);

    // Fetch episode details
    const { data: episode, error: episodeError } = await supabaseClient
      .from('episodes')
      .select('*, projects(*)')
      .eq('id', episodeId)
      .single();

    if (episodeError || !episode) {
      throw new Error('Episode not found');
    }

    // Update status
    await supabaseClient
      .from('episodes')
      .update({ 
        video_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', episodeId);

    // Generate scene breakdown with AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const scenePrompt = `You are an expert TV director and cinematographer. Analyze this episode and create a detailed scene breakdown.

Episode Title: ${episode.title}
Synopsis: ${episode.synopsis}
Script: ${episode.script}

Create 8-12 distinct scenes that tell this story cinematically. For each scene, provide:

1. Scene number
2. Detailed visual description (focus on natural human movement, expressions, body language)
3. Key dialogue or voiceover text
4. Characters present
5. Duration (in seconds, 5-15s per scene)
6. Camera movement (tracking shot, dolly in, handheld, static, pan, etc.)
7. Setting/location

Focus on:
- Natural, organic human movement (walking, gesturing, reacting)
- Authentic emotional expressions
- Dynamic camera work that follows the action
- Cinematic composition
- Reality TV aesthetic with confessionals

Return ONLY a JSON array of scenes with this structure:
[{
  "scene_number": 1,
  "description": "detailed visual description with human movement",
  "dialogue": "spoken dialogue or voiceover",
  "characters": ["Character1", "Character2"],
  "duration": 8,
  "camera_movement": "tracking shot",
  "setting": "location description"
}]`;

    const sceneResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: scenePrompt }],
      }),
    });

    const sceneData = await sceneResponse.json();
    const scenesText = sceneData.choices[0].message.content;
    const scenes: Scene[] = JSON.parse(scenesText.replace(/```json\n?/g, '').replace(/```\n?/g, ''));

    console.log(`Generated ${scenes.length} scenes`);

    // Start background video generation
    const backgroundTask = async () => {
      try {
        const videoScenes = [];

        // Generate video for each scene
        for (const scene of scenes) {
          console.log(`Generating scene ${scene.scene_number}...`);

          // Create cinematic image prompt with movement
          const imagePrompt = `Cinematic reality TV scene, ${quality} quality, professional cinematography:

SCENE: ${scene.description}

TECHNICAL SPECIFICATIONS:
- ${scene.camera_movement} camera movement
- Natural lighting, reality TV aesthetic
- 16:9 aspect ratio, 4K resolution
- Sharp focus on subjects with natural depth of field
- Authentic human expressions and body language
- Dynamic composition capturing movement

CHARACTERS: ${scene.characters.join(', ')}
SETTING: ${scene.setting}

Style: Professional reality TV production, Netflix-grade cinematography, authentic human moments, natural movement, candid expressions, documentary-style realism`;

          // Generate scene image
          const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-image-preview',
              messages: [{ role: 'user', content: imagePrompt }],
              modalities: ['image', 'text']
            }),
          });

          const imageData = await imageResponse.json();
          const imageBase64 = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

          if (!imageBase64) {
            console.error(`Failed to generate image for scene ${scene.scene_number}`);
            continue;
          }

          // Convert base64 to blob and upload
          const base64Data = imageBase64.split(',')[1];
          const blob = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          
          const fileName = `${user.id}/${episodeId}/scene_${scene.scene_number}_${Date.now()}.png`;
          const { error: uploadError } = await supabaseClient.storage
            .from('episode-videos')
            .upload(fileName, blob, {
              contentType: 'image/png',
              upsert: true
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            continue;
          }

          const { data: { publicUrl } } = supabaseClient.storage
            .from('episode-videos')
            .getPublicUrl(fileName);

          // Generate voiceover for scene dialogue
          let audioUrl = null;
          if (scene.dialogue && scene.dialogue.trim()) {
            try {
              const { data: voiceData, error: voiceError } = await supabaseClient.functions.invoke(
                'godlike-voice-bot',
                {
                  body: {
                    text: scene.dialogue,
                    voice: 'nova',
                    speed: 1.0,
                    episodeId: episodeId
                  }
                }
              );

              if (!voiceError && voiceData?.audioUrl) {
                audioUrl = voiceData.audioUrl;
              }
            } catch (voiceErr) {
              console.error('Voice generation failed:', voiceErr);
            }
          }

          videoScenes.push({
            scene_number: scene.scene_number,
            image_url: publicUrl,
            audio_url: audioUrl,
            duration: scene.duration,
            description: scene.description,
            dialogue: scene.dialogue,
            camera_movement: scene.camera_movement
          });

          console.log(`Scene ${scene.scene_number} complete`);
        }

        // Create video manifest
        const manifest = {
          episode_id: episodeId,
          scenes: videoScenes,
          total_duration: scenes.reduce((sum, s) => sum + s.duration, 0),
          generated_at: new Date().toISOString(),
          quality: quality
        };

        const manifestFileName = `${user.id}/${episodeId}/manifest_${Date.now()}.json`;
        const { error: manifestError } = await supabaseClient.storage
          .from('episode-videos')
          .upload(manifestFileName, JSON.stringify(manifest, null, 2), {
            contentType: 'application/json',
            upsert: true
          });

        if (manifestError) {
          throw manifestError;
        }

        const { data: { publicUrl: manifestUrl } } = supabaseClient.storage
          .from('episode-videos')
          .getPublicUrl(manifestFileName);

        // Update episode with video URL
        await supabaseClient
          .from('episodes')
          .update({
            video_url: manifestUrl,
            video_status: 'completed',
            storyboard: scenes,
            updated_at: new Date().toISOString()
          })
          .eq('id', episodeId);

        console.log('Cinematic video generation complete!');
      } catch (error) {
        console.error('Background task error:', error);
        await supabaseClient
          .from('episodes')
          .update({
            video_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', episodeId);
      }
    };

    // Start background task
    EdgeRuntime.waitUntil(backgroundTask());

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generating cinematic video with ${scenes.length} scenes, voiceovers, and natural movement`,
        episodeId,
        sceneCount: scenes.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
