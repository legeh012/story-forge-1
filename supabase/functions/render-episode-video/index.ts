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

    const { episodeId } = await req.json();

    if (!episodeId) {
      throw new Error('Episode ID is required');
    }

    // Fetch episode data
    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', episodeId)
      .eq('user_id', user.id)
      .single();

    if (episodeError) throw episodeError;
    if (!episode) throw new Error('Episode not found');

    // Update status to rendering
    await supabase
      .from('episodes')
      .update({
        video_status: 'rendering',
        video_render_started_at: new Date().toISOString(),
        video_render_error: null
      })
      .eq('id', episodeId);

    // Get rendering style preference
    const renderingStyle = episode.rendering_style || 'photorealistic';
    const realismSettings = episode.realism_settings || {
      anatomical_accuracy: true,
      realistic_lighting: true,
      no_cartoon_filters: true,
      natural_expressions: true,
      finger_count_validation: true,
      netflix_grade: true
    };

    // Build photorealistic quality enforcement
    const qualityPrompt = renderingStyle === 'photorealistic' ? `
CRITICAL QUALITY REQUIREMENTS (Netflix-grade):
- Photorealistic rendering ONLY, absolutely NO cartoon/anime/stylized filters
- Perfect anatomical accuracy: exactly 5 fingers per hand, natural proportions
- Realistic skin textures, pores, natural imperfections
- Cinematic lighting: natural shadows, proper color temperature, HDR-quality
- Natural facial expressions, realistic eye reflections
- 8K resolution quality, shallow depth of field
- Professional color grading (like Netflix originals)
- Real-world physics and materials
- No exaggerated features, no artistic stylization
- Film grain and cinematic bokeh effects
` : '';

    // Generate scene descriptions using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const scenePrompt = `Generate NETFLIX-GRADE PHOTOREALISTIC REALITY TV scenes with LOGICAL FLOW:
    
Title: ${episode.title}
Synopsis: ${episode.synopsis}
Content: ${episode.content}

CRITICAL: This is a REALITY TV SHOW. Generate 3-5 scenes that flow logically from one to the next.

${qualityPrompt}

Reality TV Requirements:
- Each scene must connect to the previous/next scene logically
- Include reality TV elements: confessionals, group scenes, confrontations, one-on-ones
- PHOTOREALISTIC humans only (real faces, perfect anatomy, 5 fingers)
- Natural professional lighting (reality TV standard - bright, flattering)
- Authentic emotions and genuine drama
- High-end production values (Netflix/Hulu quality)

Return a JSON array with:
- realityTVType: "confessional" | "group-scene" | "confrontation" | "one-on-one" | "dramatic-reveal"
- description: ULTRA-DETAILED photorealistic description (exact human features, emotions, environment, lighting)
- duration: 5-12 seconds each (reality TV pacing)
- voiceover: Natural realistic narration
- continuityNote: How this scene connects to previous/next scene
- technical_specs: Reality TV camera specs (handheld, multi-cam, confessional booth, etc.)

Format: {"scenes": [{"realityTVType": "...", "description": "...", "duration": 8, "voiceover": "...", "continuityNote": "...", "technical_specs": "..."}]}`;

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
            content: 'You are a Netflix reality TV showrunner. Generate PHOTOREALISTIC scene breakdowns with logical flow for reality TV episodes. Every scene must be photorealistic with perfect human anatomy and connect naturally to adjacent scenes.'
          },
          {
            role: 'user',
            content: scenePrompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('Failed to generate scene descriptions');
    }

    const aiData = await aiResponse.json();
    const scenesText = aiData.choices[0].message.content;
    
    let scenes;
    try {
      const parsed = JSON.parse(scenesText);
      scenes = parsed.scenes || [];
    } catch {
      scenes = [
        {
          description: `Visual representation of ${episode.title}`,
          duration: 5,
          voiceover: episode.synopsis
        }
      ];
    }

    // Generate images for each scene using Lovable AI with photorealism enforcement
    const sceneFrames = [];
    const frameUrls = [];
    const frameDurations = [];
    
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      
      // Build photorealistic image prompt with strict requirements
      const imagePrompt = renderingStyle === 'photorealistic' 
        ? `PHOTOREALISTIC CINEMATIC SCENE (Netflix/HBO quality):
        
${scene.description}

MANDATORY TECHNICAL SPECIFICATIONS:
- Ultra-photorealistic, NO cartoon/anime/stylized elements whatsoever
- Perfect human anatomy: EXACTLY 5 fingers per hand visible, natural proportions
- Professional cinematography: ${scene.technical_specs || '50mm lens, f/2.8, natural lighting'}
- 8K resolution quality with film grain
- Realistic skin textures with pores and natural imperfections
- Natural expressions, no exaggerated emotions
- Cinematic color grading (ARRI ALEXA camera quality)
- Proper shadows, reflections, and light bounce
- Real-world materials and physics
- Shallow depth of field with bokeh
- Professional production value matching Netflix originals
- 16:9 aspect ratio, widescreen cinematic composition

Style reference: The Crown, House of Cards, Ozark (Netflix cinematography)`
        : `${scene.description}. Style: stylized, artistic, 16:9 aspect ratio`;

      const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            {
              role: 'user',
              content: imagePrompt
            }
          ],
          modalities: ['image', 'text']
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        if (imageUrl) {
          // Upload frame to storage
          const base64Data = imageUrl.split(',')[1];
          const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          
          const framePath = `${user.id}/${episode.id}/frame_${i.toString().padStart(4, '0')}.png`;
          await supabase.storage
            .from('episode-videos')
            .upload(framePath, imageBuffer, {
              contentType: 'image/png',
              upsert: true
            });

          const { data: { publicUrl } } = supabase.storage
            .from('episode-videos')
            .getPublicUrl(framePath);

          frameUrls.push(publicUrl);
          frameDurations.push(scene.duration || 5);
          
          sceneFrames.push({
            url: publicUrl,
            voiceover: scene.voiceover,
            duration: scene.duration
          });
        }
      }
    }

    // Compile frames into video manifest
    const videoMetadata = {
      episodeId: episode.id,
      title: episode.title,
      scenes: sceneFrames,
      totalDuration: frameDurations.reduce((sum: number, d: number) => sum + d, 0),
      createdAt: new Date().toISOString()
    };

    // Call compile-video function
    console.log('🎥 Compiling frames into video manifest...');
    const compileResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/compile-video`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        episodeId: episode.id,
        userId: user.id,
        frameUrls,
        frameDurations,
        metadata: videoMetadata
      }),
    });

    let videoUrl = '';
    if (compileResponse.ok) {
      const compileData = await compileResponse.json();
      videoUrl = compileData.manifestUrl;
      console.log('✅ Video manifest created');
    } else {
      console.error('Video compilation failed:', await compileResponse.text());
      throw new Error('Failed to compile video');
    }

    return new Response(
      JSON.stringify({
        success: true,
        videoUrl,
        totalFrames: frameUrls.length,
        message: 'Video rendering completed with MP4 manifest!'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Video rendering error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Update episode with error status if we have episodeId
    try {
      const { episodeId } = await req.json();
      if (episodeId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await supabase
          .from('episodes')
          .update({
            video_status: 'failed',
            video_render_error: errorMessage
          })
          .eq('id', episodeId);
      }
    } catch (e) {
      console.error('Failed to update error status:', e);
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
