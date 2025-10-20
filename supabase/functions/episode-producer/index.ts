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

    const { episodeId, projectId } = await req.json();

    console.log(`Starting episode production for episode ${episodeId}`);

    // Get episode details
    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', episodeId)
      .single();

    if (episodeError) throw episodeError;

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;

    // Get characters for the project
    const { data: characters, error: charactersError } = await supabase
      .from('characters')
      .select('*')
      .eq('project_id', projectId);

    if (charactersError) throw charactersError;

    const productionSteps = [];
    const startTime = Date.now();

    console.log('⚡ PARALLEL PRODUCTION: Launching all bots simultaneously for sub-minute production...');

    // PHASE 1: Run independent tasks in parallel (MAXIMUM SPEED)
    const [scriptResult, hookResult] = await Promise.all([
      supabase.functions.invoke('script-generator-bot', {
        body: {
          episodeId,
          projectTheme: project.theme,
          episodeTitle: episode.title,
          characters: characters.map(c => ({
            name: c.name,
            role: c.role,
            personality: c.personality
          }))
        }
      }),
      supabase.functions.invoke('hook-optimization-bot', {
        body: {
          title: episode.title,
          description: episode.synopsis,
          genre: project.genre
        }
      })
    ]);

    console.log(`✅ Phase 1 complete (${Date.now() - startTime}ms) - Script & Hooks ready`);

    productionSteps.push(
      {
        step: 'Script Generation',
        status: scriptResult.error ? 'failed' : 'completed',
        result: scriptResult.data
      },
      {
        step: 'Hook Optimization',
        status: hookResult.error ? 'failed' : 'completed',
        result: hookResult.data
      }
    );

    // PHASE 2: Run cultural injection and direction in parallel
    const [culturalResult, directionResult] = await Promise.all([
      supabase.functions.invoke('cultural-injection-bot', {
        body: {
          script: scriptResult.data?.script || episode.script,
          genre: project.genre,
          theme: project.theme
        }
      }),
      supabase.functions.invoke('expert-director', {
        body: {
          prompt: `Direct a reality TV scene for "${episode.title}" with dramatic pacing and strong character moments`,
          episodeId: episodeId
        }
      })
    ]);

    console.log(`✅ Phase 2 complete (${Date.now() - startTime}ms) - Cultural & Direction ready`);

    productionSteps.push(
      {
        step: 'Cultural Injection',
        status: culturalResult.error ? 'failed' : 'completed',
        result: culturalResult.data
      },
      {
        step: 'Expert Direction',
        status: directionResult.error ? 'failed' : 'completed',
        result: directionResult.data
      }
    );

    // PHASE 3: Scene orchestration with enhanced script
    const sceneResult = await supabase.functions.invoke('scene-orchestration', {
      body: {
        episodeId,
        script: culturalResult.data?.injected_content || scriptResult.data?.script,
        direction: directionResult.data?.direction,
        characters
      }
    });

    console.log(`✅ Phase 3 complete (${Date.now() - startTime}ms) - Scenes orchestrated`);

    productionSteps.push({
      step: 'Scene Orchestration',
      status: sceneResult.error ? 'failed' : 'completed',
      result: sceneResult.data
    });

    // Step 6: Update episode with production results
    console.log('Step 6: Updating episode...');
    const updateData: any = {
      status: 'script_ready',
      script: culturalResult.data?.injected_content || scriptResult.data?.script,
      storyboard: sceneResult.data?.scenes || []
    };

    if (hookResult.data?.optimized_title) {
      updateData.title = hookResult.data.optimized_title;
    }

    if (hookResult.data?.optimized_description) {
      updateData.synopsis = hookResult.data.optimized_description;
    }

    const { error: updateError } = await supabase
      .from('episodes')
      .update(updateData)
      .eq('id', episodeId);

    if (updateError) {
      console.error('Episode update failed:', updateError);
    }

    productionSteps.push({
      step: 'Episode Update',
      status: updateError ? 'failed' : 'completed'
    });

    // PHASE 4: Launch ultra-fast video generation (fire-and-forget for max speed)
    const scenes = sceneResult.data?.scenes || [];
    
    if (scenes.length > 0) {
      console.log(`🎥 Launching ultra-video-bot for PARALLEL frame generation (${scenes.length} scenes)...`);
      
      // Fire-and-forget for instant response - let video generation happen in background
      supabase.functions.invoke('ultra-video-bot', {
        body: {
          episodeId,
          projectId,
          userId: user.id,
          scenes: scenes.map((scene: any) => ({
            description: scene.description || scene.visual_description || 'Scene from the episode',
            duration: scene.duration || 5,
            dialogue: scene.dialogue || scene.voiceover
          }))
        }
      }).catch(err => console.error('Video generation error:', err));

      productionSteps.push({
        step: 'Video Generation',
        status: 'started',
        result: { message: 'Ultra-fast parallel generation started' }
      });

      console.log(`✅ Video generation started (${Date.now() - startTime}ms)`);
    } else {
      productionSteps.push({
        step: 'Video Generation',
        status: 'skipped',
        result: { message: 'No scenes available' }
      });
    }

    // Log execution stats
    const totalTime = Date.now() - startTime;
    const completedSteps = productionSteps.filter(s => s.status === 'completed' || s.status === 'started').length;
    const successRate = (completedSteps / productionSteps.length) * 100;

    await supabase.from('bot_execution_stats').insert({
      bot_type: 'production_team',
      episode_id: episodeId,
      execution_time_ms: totalTime,
      quality_score: successRate,
      metadata: {
        steps: productionSteps,
        success_rate: successRate,
        parallel_execution: true,
        total_time_ms: totalTime
      }
    });

    console.log(`⚡ PRODUCTION COMPLETE: ${totalTime}ms (${(totalTime/1000).toFixed(2)}s) - Success rate: ${successRate}%`);

    return new Response(
      JSON.stringify({
        success: true,
        episodeId,
        productionSteps,
        successRate,
        totalTimeMs: totalTime,
        totalTimeSec: (totalTime/1000).toFixed(2),
        parallelExecution: true,
        message: `⚡ Episode produced in ${(totalTime/1000).toFixed(2)}s with parallel bot execution. Video rendering in progress.`,
        readyForVideo: successRate >= 80
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Episode producer error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});