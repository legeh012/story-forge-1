import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Video Generation Started ===');
    
    const { episodeId } = await req.json();
    
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

    const storyboard = episode.storyboard || [];
    const scenes = Array.isArray(storyboard) ? storyboard : [];
    
    console.log(`Processing episode: ${episodeId}, Scenes count: ${scenes.length}`);

    if (scenes.length === 0) {
      throw new Error('No scenes in storyboard to generate video from');
    }

    // Update status to processing
    await supabase
      .from('episodes')
      .update({ 
        video_status: 'processing',
        video_render_started_at: new Date().toISOString()
      })
      .eq('id', episodeId);

    console.log('📝 Episode status updated to PROCESSING');
    console.log('🤖 Activating AI Bot Team for collaborative video generation...');

    // Use background task for collaborative bot orchestration
    const backgroundTask = async () => {
      console.log(`=== 🎬 COLLABORATIVE BOT PIPELINE STARTED for ${episodeId} ===`);
      
      try {
        // STREAMLINED: Skip heavy preprocessing bots, go straight to video generation
        console.log('⚡ FAST MODE: Skipping preprocessing, starting video generation...');

        // Update to rendering status before frame generation
        await supabase
          .from('episodes')
          .update({ video_status: 'rendering' })
          .eq('id', episodeId);

        // PHASE 1: 5x PARALLEL BOT ARMY - Ultra-fast generation
        console.log('🎥 PHASE 1: Deploying 5x Parallel Bot Army for ultra-fast generation...');
        
        // Run 5 parallel bot instances for 5x speed
        const botPromises = Array.from({ length: 5 }, (_, index) => {
          console.log(`🤖 Launching Bot Squad #${index + 1}...`);
          return fetch(
            `${supabaseUrl}/functions/v1/ultra-video-bot`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`
              },
              body: JSON.stringify({
                episodeId: episodeId,
                enhancementLevel: 'photorealistic',
                squadNumber: index + 1,
                totalSquads: 5
              })
            }
          ).then(async (response) => {
            if (!response.ok) {
              const errorText = await response.text();
              console.error(`❌ Bot Squad #${index + 1} failed:`, errorText);
              return { success: false, squadNumber: index + 1 };
            }
            const data = await response.json();
            console.log(`✅ Bot Squad #${index + 1} complete: ${data.framesGenerated || 0} scenes`);
            return { ...data, squadNumber: index + 1 };
          }).catch(error => {
            console.error(`❌ Bot Squad #${index + 1} error:`, error);
            return { success: false, squadNumber: index + 1, error: error.message };
          });
        });

        const botResults = await Promise.all(botPromises);
        
        const successfulBots = botResults.filter(r => r.success);
        const totalFrames = botResults.reduce((sum, r) => sum + (r.framesGenerated || 0), 0);
        
        console.log(`✅ PHASE 1 COMPLETE: ${successfulBots.length}/5 squads successful`);
        console.log(`🎬 Total frames generated: ${totalFrames}`);
        
        if (successfulBots.length === 0) {
          throw new Error('All bot squads failed - video generation unsuccessful');
        }

        const videoData = successfulBots[0]; // Use first successful result

        // Video compilation is handled automatically by ultra-video-bot
        // Get public URL for the video manifest
        const { data: { publicUrl } } = supabase.storage
          .from('episode-videos')
          .getPublicUrl(`${episode.user_id}/${episodeId}/video-manifest.json`);

        // Update episode with video URL and completed status
        const { error: updateError } = await supabase
          .from('episodes')
          .update({
            video_url: publicUrl,
            video_status: 'completed',
            video_render_completed_at: new Date().toISOString()
          })
          .eq('id', episodeId);

        if (updateError) {
          console.error('Failed to update episode:', updateError);
        }

        console.log(`=== 🎉 FAST VIDEO GENERATION COMPLETE for ${episodeId} ===`);
        console.log(`Video Frames: ${videoData.framesGenerated || 0} scenes`);
        console.log(`Total Time: Fast mode enabled`);
        
      } catch (error) {
        console.error('Background processing error:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Update episode with error status
        await supabase
          .from('episodes')
          .update({
            video_status: 'failed',
            video_render_error: errorMessage
          })
          .eq('id', episodeId);
      }
    };

    // Start background processing without awaiting
    backgroundTask().catch(err => console.error('Background task error:', err));

    // Return immediate response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Video generation started in background',
        episodeId,
        sceneCount: scenes.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Video generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
