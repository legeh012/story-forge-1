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

    // Update status to rendering
    await supabase
      .from('episodes')
      .update({ 
        video_status: 'rendering',
        video_render_started_at: new Date().toISOString()
      })
      .eq('id', episodeId);

    console.log('Episode status updated to rendering');

    // Use background task for parallel frame generation
    const backgroundTask = async () => {
      console.log(`=== Background Processing Started for ${episodeId} ===`);
      
      try {
        // Call parallel frame generator
        const frameGenResponse = await fetch(
          `${supabaseUrl}/functions/v1/parallel-frame-generator`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({
              episodeId,
              scenes,
              userId: episode.user_id
            })
          }
        );

        if (!frameGenResponse.ok) {
          const errorText = await frameGenResponse.text();
          throw new Error(`Parallel frame generation failed: ${errorText}`);
        }

        const frameData = await frameGenResponse.json();
        
        if (!frameData.success) {
          throw new Error('Frame generation reported failure');
        }

        // Get public URL for the metadata
        const { data: { publicUrl } } = supabase.storage
          .from('episode-videos')
          .getPublicUrl(`${episode.user_id}/${episodeId}/metadata.json`);

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

        console.log(`=== Video generation completed successfully for ${episodeId} ===`);
        console.log(`Performance: ${JSON.stringify(frameData.performance)}`);
        
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
