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
    // Use service role for internal bot operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { episodeId, userId } = await req.json();

    if (!episodeId) {
      throw new Error('Episode ID is required');
    }

    console.log(`🎬 Starting video render for episode ${episodeId}`);

    // Fetch episode data using service role
    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', episodeId)
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

    console.log(`📊 Episode: ${episode.title}`);
    console.log(`🎨 Style: ${episode.rendering_style || 'photorealistic'}`);

    // Call ultra-video-bot for high-quality video generation
    console.log('🚀 Invoking ultra-video-bot for Netflix-grade production...');
    
    const { data: videoData, error: videoError } = await supabase.functions.invoke('ultra-video-bot', {
      body: {
        episodeId: episode.id,
        enhancementLevel: 'ultra' // Maximum quality
      }
    });

    if (videoError) {
      console.error('Ultra-video-bot failed:', videoError);
      throw new Error(`Video generation failed: ${videoError.message}`);
    }

    if (!videoData?.videoUrl) {
      throw new Error('No video URL returned from ultra-video-bot');
    }

    console.log(`✅ Video generated successfully: ${videoData.videoUrl}`);

    // Update episode with completed video
    const { error: updateError } = await supabase
      .from('episodes')
      .update({
        video_status: 'completed',
        video_url: videoData.videoUrl,
        video_render_completed_at: new Date().toISOString(),
        video_render_error: null
      })
      .eq('id', episodeId);

    if (updateError) {
      console.error('Failed to update episode:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        videoUrl: videoData.videoUrl,
        message: 'Netflix-grade video rendering completed!',
        details: videoData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Video rendering error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Update episode with error status
    try {
      const body = await req.clone().json();
      const { episodeId } = body;
      
      if (episodeId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await supabase
          .from('episodes')
          .update({
            video_status: 'failed',
            video_render_error: errorMessage,
            video_render_completed_at: new Date().toISOString()
          })
          .eq('id', episodeId);
      }
    } catch (e) {
      console.error('Failed to update error status:', e);
    }

    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
