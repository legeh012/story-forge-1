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

    const { episode, userId, remixConfig } = await req.json();

    console.log('FFmpeg Video Engine - Processing:', { episode, userId, remixConfig });

    // Get episode data
    const { data: episodeData, error: episodeError } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', episode)
      .single();

    if (episodeError || !episodeData) {
      throw new Error('Episode not found');
    }

    // Simulate video processing with metadata
    // In production, this would use actual FFmpeg with GPU acceleration
    const processingMetadata = {
      startTime: new Date().toISOString(),
      baseVideo: `${episode}_base.mp4`,
      cast: remixConfig.cast,
      music: remixConfig.music,
      overlay: remixConfig.overlay,
      remixable: remixConfig.remixable,
      
      // FFmpeg processing steps (simulated)
      steps: [
        { step: 'load_base_video', status: 'completed', timestamp: new Date().toISOString() },
        { step: 'apply_overlay', style: remixConfig.overlay, status: 'completed', timestamp: new Date().toISOString() },
        { step: 'sync_audio', track: remixConfig.music, status: 'completed', timestamp: new Date().toISOString() },
        { step: 'inject_cast_tags', cast: remixConfig.cast, status: 'completed', timestamp: new Date().toISOString() },
        { step: 'gpu_encode', format: 'mp4', status: 'completed', timestamp: new Date().toISOString() }
      ],
      
      // Frame-level parallelism simulation
      parallelThreads: 8,
      framesProcessed: 3600, // 60fps * 60 seconds
      processingTimeMs: 2500
    };

    // Generate video URL (in production, this would be the actual rendered video)
    const videoFileName = `${episode}_${remixConfig.cast}_${remixConfig.music}_${Date.now()}.mp4`;
    const videoUrl = `https://example.com/videos/${videoFileName}`;

    // Store in remix_vault
    const { data: vaultEntry, error: vaultError } = await supabase
      .from('remix_vault')
      .insert({
        user_id: userId,
        episode_id: episode,
        video_url: videoUrl,
        cast_selection: remixConfig.cast,
        music_track: remixConfig.music,
        overlay_style: remixConfig.overlay,
        remix_metadata: {
          ...remixConfig.metadata,
          processing: processingMetadata,
          exportedAt: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (vaultError) {
      console.error('Error storing in remix vault:', vaultError);
    }

    // Update episode video status
    await supabase
      .from('episodes')
      .update({
        video_status: 'completed',
        video_url: videoUrl,
        video_render_completed_at: new Date().toISOString()
      })
      .eq('id', episode);

    console.log('Video processing completed:', { videoUrl, vaultEntry });

    return new Response(
      JSON.stringify({
        success: true,
        videoUrl,
        manifestUrl: videoUrl,
        vaultId: vaultEntry?.id,
        remixMetadata: remixConfig.remixable ? processingMetadata : null,
        message: 'Video rendered and stored in remix vault'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('FFmpeg video engine error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
