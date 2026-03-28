import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { episodeId } = await req.json();
    if (!episodeId) throw new Error('episodeId is required');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .select('*, projects(*)')
      .eq('id', episodeId)
      .single();

    if (episodeError || !episode) {
      throw new Error(`Episode not found: ${episodeError?.message}`);
    }

    // Update status to processing
    await supabase
      .from('episodes')
      .update({
        video_status: 'processing',
        video_render_started_at: new Date().toISOString(),
        video_render_error: null,
      })
      .eq('id', episodeId);

    // Background: generate AI scene images via ultra-video-bot, then store manifest
    const backgroundTask = async () => {
      try {
        await supabase
          .from('episodes')
          .update({ video_status: 'rendering' })
          .eq('id', episodeId);

        // Call ultra-video-bot which generates real AI images
        const { data: videoData, error: videoError } = await supabase.functions.invoke('ultra-video-bot', {
          body: {
            episodeId,
            enhancementLevel: 'ultra',
          },
        });

        if (videoError) {
          throw new Error(`Scene generation failed: ${videoError.message}`);
        }

        // ultra-video-bot uploads frames to storage and returns metadata
        // The "videoUrl" from ultra-video-bot points to a metadata.json manifest
        const manifestUrl = videoData?.videoUrl || videoData?.video_url;

        if (manifestUrl) {
          await supabase
            .from('episodes')
            .update({
              video_url: manifestUrl,
              video_status: 'completed',
              video_render_completed_at: new Date().toISOString(),
            })
            .eq('id', episodeId);
          console.log(`✅ Video generation complete: ${manifestUrl}`);
        } else {
          await supabase
            .from('episodes')
            .update({
              video_status: 'failed',
              video_render_error: 'Scene generation did not return a manifest URL.',
              video_render_completed_at: new Date().toISOString(),
            })
            .eq('id', episodeId);
        }
      } catch (error) {
        console.error('Background processing error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await supabase
          .from('episodes')
          .update({
            video_status: 'failed',
            video_render_error: errorMessage,
          })
          .eq('id', episodeId);
      }
    };

    backgroundTask().catch((err) => console.error('Background task error:', err));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Video generation started — AI scene generation active',
        episodeId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Video generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
