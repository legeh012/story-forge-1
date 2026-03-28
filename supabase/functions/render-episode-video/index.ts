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

    const { episodeId } = await req.json();
    if (!episodeId) throw new Error('Episode ID is required');

    console.log(`🎬 Starting video render for episode ${episodeId}`);

    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', episodeId)
      .single();

    if (episodeError) throw episodeError;
    if (!episode) throw new Error('Episode not found');

    // Update status
    await supabase
      .from('episodes')
      .update({
        video_status: 'rendering',
        video_render_started_at: new Date().toISOString(),
        video_render_error: null,
      })
      .eq('id', episodeId);

    // Call ultra-video-bot for AI scene generation
    const { data: videoData, error: videoError } = await supabase.functions.invoke('ultra-video-bot', {
      body: {
        episodeId: episode.id,
        enhancementLevel: 'ultra',
      },
    });

    if (videoError) {
      throw new Error(`Video generation failed: ${videoError.message}`);
    }

    const manifestUrl = videoData?.videoUrl || videoData?.video_url;

    if (!manifestUrl) {
      throw new Error('No manifest URL returned from scene generator');
    }

    // Update episode with completed manifest
    await supabase
      .from('episodes')
      .update({
        video_status: 'completed',
        video_url: manifestUrl,
        video_render_completed_at: new Date().toISOString(),
        video_render_error: null,
      })
      .eq('id', episodeId);

    return new Response(
      JSON.stringify({
        success: true,
        videoUrl: manifestUrl,
        message: 'Scene generation complete — use client-side Remotion to compile MP4',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Video rendering error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    try {
      const body = await req.clone().json();
      if (body.episodeId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        await supabase
          .from('episodes')
          .update({
            video_status: 'failed',
            video_render_error: errorMessage,
            video_render_completed_at: new Date().toISOString(),
          })
          .eq('id', body.episodeId);
      }
    } catch (e) {
      console.error('Failed to update error status:', e);
    }

    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
