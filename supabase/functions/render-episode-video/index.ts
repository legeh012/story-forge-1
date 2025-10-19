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

    // Generate scene descriptions using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const scenePrompt = `Based on this episode content, generate 3-5 key visual scenes for a video:
    
Title: ${episode.title}
Synopsis: ${episode.synopsis}
Content: ${episode.content}

Return a JSON array of scenes with:
- description: detailed visual description
- duration: duration in seconds (3-5 seconds each)
- voiceover: narration text for this scene

Format: {"scenes": [{"description": "...", "duration": 3, "voiceover": "..."}]}`;

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
            content: 'You are a video production assistant. Generate scene breakdowns for episodes.'
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

    // Generate images for each scene using Lovable AI image generation
    const sceneAssets = [];
    
    for (const scene of scenes) {
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
              content: `Generate a cinematic scene: ${scene.description}. Style: high-quality reality TV production, dramatic lighting, 16:9 aspect ratio`
            }
          ],
          modalities: ['image', 'text']
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        sceneAssets.push({
          imageUrl,
          voiceover: scene.voiceover,
          duration: scene.duration
        });
      }
    }

    // Create a simple video metadata (in production, you'd compile these into actual video)
    const videoMetadata = {
      episodeId: episode.id,
      title: episode.title,
      scenes: sceneAssets,
      totalDuration: scenes.reduce((sum: number, s: any) => sum + s.duration, 0),
      createdAt: new Date().toISOString()
    };

    // In a real implementation, you would:
    // 1. Use a video rendering service (like Remotion, Shotstack, or FFmpeg)
    // 2. Compile images with voiceover
    // 3. Upload final video to storage bucket
    
    // For now, we'll store the metadata and mark as completed
    const videoUrl = `episode-videos/${episode.id}/preview.json`;
    
    // Upload metadata to storage
    const { error: uploadError } = await supabase.storage
      .from('episode-videos')
      .upload(
        `${episode.id}/metadata.json`,
        JSON.stringify(videoMetadata, null, 2),
        {
          contentType: 'application/json',
          upsert: true
        }
      );

    if (uploadError) {
      console.error('Upload error:', uploadError);
    }

    // Update episode with completed status
    const { error: updateError } = await supabase
      .from('episodes')
      .update({
        video_status: 'completed',
        video_url: videoUrl,
        video_render_completed_at: new Date().toISOString()
      })
      .eq('id', episodeId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        videoMetadata,
        message: 'Video rendering completed! (Preview mode - metadata generated)'
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
