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
    console.log('=== Video Generation Started ===');
    
    const { episodeId } = await req.json();
    
    if (!episodeId) {
      throw new Error('episodeId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch episode details
    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .select('*, projects(*)')
      .eq('id', episodeId)
      .single();

    if (episodeError || !episode) {
      throw new Error(`Episode not found: ${episodeError?.message}`);
    }

    console.log(`Processing episode: ${episodeId}`);

    // Update status to processing immediately
    await supabase
      .from('episodes')
      .update({ 
        video_status: 'processing',
        video_render_started_at: new Date().toISOString(),
        video_render_error: null,
      })
      .eq('id', episodeId);

    // Return immediately — do generation in background
    const backgroundTask = async () => {
      try {
        await supabase
          .from('episodes')
          .update({ video_status: 'rendering' })
          .eq('id', episodeId);

        // PHASE 1: Try Infinite Creation Engine (2075-grade)
        console.log('🚀 Phase 1: Infinite Creation Engine...');
        let videoUrl: string | null = null;

        try {
          const engineResponse = await fetch(
            `${supabaseUrl}/functions/v1/infinite-creation-engine`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`
              },
              body: JSON.stringify({
                episodeId,
                prompt: episode.script || episode.synopsis || episode.title,
                characters: [],
                mood: 'dramatic',
                style: 'photorealistic-reality-tv',
                action: 'generate'
              })
            }
          );

          if (engineResponse.ok) {
            const engineData = await engineResponse.json();
            if (engineData.videoUrl) {
              videoUrl = engineData.videoUrl;
              console.log('✅ Infinite Creation Engine produced video');
            } else {
              console.log('⚠️ Engine responded but no videoUrl');
            }
          } else {
            const text = await engineResponse.text();
            console.log(`⚠️ Engine returned ${engineResponse.status}: ${text.substring(0, 200)}`);
          }
        } catch (err) {
          console.log('⚠️ Infinite Creation Engine unavailable, proceeding to fallback');
        }

        // PHASE 2: Fallback — mark as completed with placeholder if no real video
        if (!videoUrl) {
          console.log('🎥 Phase 2: Bot Army fallback...');

          // Try ultra-video-bot
          try {
            const botResponse = await fetch(
              `${supabaseUrl}/functions/v1/ultra-video-bot`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseKey}`
                },
                body: JSON.stringify({
                  episodeId,
                  enhancementLevel: 'photorealistic',
                })
              }
            );

            if (botResponse.ok) {
              const botData = await botResponse.json();
              videoUrl = botData?.videoUrl || botData?.video_url || null;
              console.log('✅ Ultra Video Bot complete');
            } else {
              const text = await botResponse.text();
              console.log(`⚠️ Ultra Video Bot returned ${botResponse.status}`);
            }
          } catch (err) {
            console.log('⚠️ Ultra Video Bot failed');
          }
        }

        // Update episode with result
        if (videoUrl) {
          await supabase
            .from('episodes')
            .update({
              video_url: videoUrl,
              video_status: 'completed',
              video_render_completed_at: new Date().toISOString()
            })
            .eq('id', episodeId);
          console.log(`🎉 Video generation complete: ${videoUrl}`);
        } else {
          // Mark as completed even without a real video URL for now
          // so the UI doesn't get stuck in "rendering" state forever
          await supabase
            .from('episodes')
            .update({
              video_status: 'failed',
              video_render_error: 'Video generation engines are currently unavailable. The Infinite Creation Engine will process your episode when back online.',
              video_render_completed_at: new Date().toISOString()
            })
            .eq('id', episodeId);
          console.log('⚠️ No video URL produced — marked as failed with message');
        }

      } catch (error) {
        console.error('Background processing error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        await supabase
          .from('episodes')
          .update({
            video_status: 'failed',
            video_render_error: errorMessage
          })
          .eq('id', episodeId);
      }
    };

    // Fire and forget
    backgroundTask().catch(err => console.error('Background task error:', err));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Video generation started — Infinite Creation Engine + Bot Army active',
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
