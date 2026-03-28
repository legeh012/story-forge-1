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

    console.log('🎬 BATCH VIDEO RENDERER — Real Pipeline');

    // Fetch all episodes for this user
    const { data: episodes, error: episodesError } = await supabase
      .from('episodes')
      .select('*')
      .eq('user_id', user.id)
      .order('episode_number', { ascending: true });

    if (episodesError || !episodes) throw new Error('Failed to fetch episodes');

    console.log(`✅ Found ${episodes.length} episodes`);

    const batchStartTime = Date.now();
    const results: Array<{
      episodeId: string;
      episodeNumber: number;
      title: string;
      status: string;
      videoUrl?: string;
      error?: string;
      processingTime?: number;
    }> = [];

    // Process in batches of 2 (AI image gen is expensive)
    const BATCH_SIZE = 2;

    for (let i = 0; i < episodes.length; i += BATCH_SIZE) {
      const batch = episodes.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (episode) => {
        const start = Date.now();
        try {
          await supabase
            .from('episodes')
            .update({ video_status: 'rendering', updated_at: new Date().toISOString() })
            .eq('id', episode.id);

          // Call ultra-video-bot for real AI scene generation
          const { data: videoResult, error: videoError } = await supabase.functions.invoke('ultra-video-bot', {
            body: { episodeId: episode.id, enhancementLevel: 'ultra' },
          });

          if (videoError) throw new Error(videoError.message);

          const manifestUrl = videoResult?.videoUrl || videoResult?.video_url;

          await supabase
            .from('episodes')
            .update({
              video_status: manifestUrl ? 'completed' : 'failed',
              video_url: manifestUrl || null,
              video_render_completed_at: new Date().toISOString(),
              video_render_error: manifestUrl ? null : 'No manifest returned',
            })
            .eq('id', episode.id);

          return {
            episodeId: episode.id,
            episodeNumber: episode.episode_number,
            title: episode.title,
            status: manifestUrl ? 'completed' : 'failed',
            videoUrl: manifestUrl,
            processingTime: Date.now() - start,
          };
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          await supabase
            .from('episodes')
            .update({ video_status: 'failed', video_render_error: msg })
            .eq('id', episode.id);

          return {
            episodeId: episode.id,
            episodeNumber: episode.episode_number,
            title: episode.title,
            status: 'failed',
            error: msg,
            processingTime: Date.now() - start,
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    const totalTime = Date.now() - batchStartTime;
    const successCount = results.filter((r) => r.status === 'completed').length;

    return new Response(
      JSON.stringify({
        success: true,
        totalEpisodes: results.length,
        successCount,
        failCount: results.length - successCount,
        totalProcessingTime: `${(totalTime / 1000 / 60).toFixed(2)} minutes`,
        results: results.map((r) => ({
          episodeNumber: r.episodeNumber,
          title: r.title,
          status: r.status,
          videoUrl: r.videoUrl,
          error: r.error,
          processingTime: r.processingTime ? `${(r.processingTime / 1000).toFixed(2)}s` : null,
        })),
        message: `🎬 Batch complete: ${successCount}/${results.length} episodes rendered`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Batch video renderer error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
