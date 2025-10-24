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
        // PHASE 1: Expert Director + Production Team (Parallel)
        console.log('🎯 PHASE 1: Director & Production Team activation...');
        const phase1Promises = [
          // Expert Director
          fetch(`${supabaseUrl}/functions/v1/expert-director`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({
              prompt: episode.synopsis || episode.title,
              episodeId: episodeId
            })
          }).catch(err => ({ ok: false, error: err.message })),
          
          // Production Team - Casting Director
          fetch(`${supabaseUrl}/functions/v1/production-team`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({
              role: 'casting_director',
              sceneData: scenes,
              episodeId: episodeId
            })
          }).catch(err => ({ ok: false, error: err.message })),
          
          // Production Team - Scene Stylist
          fetch(`${supabaseUrl}/functions/v1/production-team`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({
              role: 'scene_stylist',
              sceneData: scenes,
              episodeId: episodeId
            })
          }).catch(err => ({ ok: false, error: err.message })),
          
          // Production Team - Drama Editor
          fetch(`${supabaseUrl}/functions/v1/production-team`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({
              role: 'drama_editor',
              sceneData: scenes,
              episodeId: episodeId
            })
          }).catch(err => ({ ok: false, error: err.message }))
        ];

        const phase1Results = await Promise.allSettled(phase1Promises);
        const phase1Success = phase1Results.filter(r => 
          r.status === 'fulfilled' && (r.value as any).ok
        ).length;
        console.log(`✅ PHASE 1: ${phase1Success}/4 bots completed successfully`);

        // PHASE 2: Scene Orchestration
        console.log('🎭 PHASE 2: Scene Orchestration Engine...');
        const sceneOrchestrationResponse: any = await fetch(`${supabaseUrl}/functions/v1/scene-orchestration`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            episodeId: episodeId
          })
        }).catch(err => {
          console.log('⚠️ Scene Orchestration skipped:', err.message);
          return { ok: false };
        });

        if (sceneOrchestrationResponse.ok) {
          const orchestrationData = await sceneOrchestrationResponse.json();
          console.log(`✅ PHASE 2: ${orchestrationData.scenesGenerated || 0} scenes orchestrated`);
        }

        // PHASE 3: Cultural Injection
        console.log('🌍 PHASE 3: Cultural Injection Bot...');
        await fetch(`${supabaseUrl}/functions/v1/cultural-injection-bot`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            episodeId: episodeId,
            culturalContext: 'diaspora_life'
          })
        }).catch(err => console.log('⚠️ Cultural Injection skipped:', err.message));

        console.log('✅ PHASE 3: Cultural context integrated');

        // Update to rendering status before frame generation
        await supabase
          .from('episodes')
          .update({ video_status: 'rendering' })
          .eq('id', episodeId);

        // PHASE 4: Ultra Video Bot - Parallel Frame Generation
        console.log('🎥 PHASE 4: Ultra Video Bot - PARALLEL frame generation...');
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
          throw new Error(`Ultra Video Bot failed: ${errorText}`);
        }

        const frameData = await frameGenResponse.json();
        
        if (!frameData.success) {
          throw new Error('Frame generation reported failure');
        }

        console.log(`✅ PHASE 4: ${frameData.performance?.framesGenerated || 0} frames generated`);

        // Video compilation is handled automatically by parallel-frame-generator
        // Get public URL for the video manifest (not metadata.json)
        const { data: { publicUrl } } = supabase.storage
          .from('episode-videos')
          .getPublicUrl(`${episode.user_id}/${episodeId}/video-manifest.json`);

        // PHASE 5: Post-Production Bots (Parallel - Non-blocking)
        console.log('🚀 PHASE 5: Post-production bot activation...');
        const phase5Promises = [
          // Hook Optimization Bot
          fetch(`${supabaseUrl}/functions/v1/hook-optimization-bot`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({
              episodeId: episodeId,
              content: {
                title: episode.title,
                synopsis: episode.synopsis
              }
            })
          }).catch(err => ({ ok: false, error: err.message })),
          
          // Trend Detection Bot
          fetch(`${supabaseUrl}/functions/v1/trend-detection-bot`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({
              userId: episode.user_id,
              platform: 'all',
              trendType: 'viral'
            })
          }).catch(err => ({ ok: false, error: err.message })),
          
          // Performance Tracker Bot
          fetch(`${supabaseUrl}/functions/v1/performance-tracker-bot`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({
              userId: episode.user_id,
              contentId: episodeId,
              platform: 'youtube'
            })
          }).catch(err => ({ ok: false, error: err.message }))
        ];

        const phase5Results = await Promise.allSettled(phase5Promises);
        const phase5Success = phase5Results.filter(r => 
          r.status === 'fulfilled' && (r.value as any).ok
        ).length;
        console.log(`✅ PHASE 5: ${phase5Success}/3 post-production bots completed`);

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

        console.log(`=== 🎉 COLLABORATIVE BOT PIPELINE COMPLETE for ${episodeId} ===`);
        console.log(`Performance: ${JSON.stringify(frameData.performance)}`);
        console.log(`Total Bots Activated: ${phase1Success + phase5Success + 3} bots working in harmony`);
        
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
