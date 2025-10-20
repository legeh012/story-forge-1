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

    // PHASE 1: Run independent tasks in parallel (MAXIMUM SPEED + VIRAL INTELLIGENCE)
    const [scriptResult, hookResult, trendResult] = await Promise.all([
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
      }),
      // NEW: Trend detection for viral relevance
      supabase.functions.invoke('trend-detection-bot', {
        body: {
          platform: 'tiktok', // Primary viral platform
          genre: project.genre,
          theme: project.theme
        }
      })
    ]);

    console.log(`✅ Phase 1 complete (${Date.now() - startTime}ms) - Script, Hooks & Trends ready`);

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
      },
      {
        step: 'Trend Detection',
        status: trendResult.error ? 'failed' : 'completed',
        result: trendResult.data
      }
    );

    // PHASE 2: Run cultural injection, direction, and viral optimization in parallel
    const [culturalResult, directionResult, viralOptResult] = await Promise.all([
      supabase.functions.invoke('cultural-injection-bot', {
        body: {
          script: scriptResult.data?.script || episode.script,
          genre: project.genre,
          theme: project.theme,
          trends: trendResult.data?.trends // Inject detected trends
        }
      }),
      supabase.functions.invoke('expert-director', {
        body: {
          prompt: `Direct a reality TV scene for "${episode.title}" with dramatic pacing and strong character moments`,
          episodeId: episodeId
        }
      }),
      // NEW: Viral optimization for maximum engagement
      supabase.functions.invoke('performance-optimizer-bot', {
        body: {
          episodeId,
          content: scriptResult.data?.script || episode.script,
          trends: trendResult.data?.trends,
          hooks: hookResult.data
        }
      })
    ]);

    console.log(`✅ Phase 2 complete (${Date.now() - startTime}ms) - Cultural, Direction & Viral Optimization ready`);

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
      },
      {
        step: 'Viral Optimization',
        status: viralOptResult.error ? 'failed' : 'completed',
        result: viralOptResult.data
      }
    );

    // PHASE 3: Scene orchestration with enhanced, trend-aware, virally-optimized script
    const sceneResult = await supabase.functions.invoke('scene-orchestration', {
      body: {
        episodeId,
        script: culturalResult.data?.injected_content || scriptResult.data?.script,
        direction: directionResult.data?.direction,
        characters,
        trends: trendResult.data?.trends, // Pass trends for viral scene construction
        viralOptimizations: viralOptResult.data?.optimizations // Apply viral optimizations
      }
    });

    console.log(`✅ Phase 3 complete (${Date.now() - startTime}ms) - Scenes orchestrated with viral intelligence`);

    productionSteps.push({
      step: 'Scene Orchestration',
      status: sceneResult.error ? 'failed' : 'completed',
      result: sceneResult.data
    });

    // Step 6: Update episode with production results (including viral metadata)
    console.log('Step 6: Updating episode with viral-optimized content...');
    const updateData: any = {
      status: 'script_ready',
      script: culturalResult.data?.injected_content || scriptResult.data?.script,
      storyboard: sceneResult.data?.scenes || [],
      metadata: {
        trends: trendResult.data?.trends || [],
        viralScore: viralOptResult.data?.predicted_viral_score || 0,
        optimizations: viralOptResult.data?.optimizations || {},
        hooks: hookResult.data || {}
      }
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

    // PHASE 4: Launch ultra-fast viral-optimized video generation
    const scenes = sceneResult.data?.scenes || [];
    
    if (scenes.length > 0) {
      console.log(`🎥 Launching ultra-video-bot with VIRAL OPTIMIZATION (${scenes.length} scenes)...`);
      
      // Fire-and-forget for instant response - let video generation happen in background
      supabase.functions.invoke('ultra-video-bot', {
        body: {
          episodeId,
          projectId,
          userId: user.id,
          scenes: scenes.map((scene: any) => ({
            description: scene.description || scene.visual_description || 'Scene from the episode',
            duration: scene.duration || 5,
            dialogue: scene.dialogue || scene.voiceover,
            viralElements: scene.viralElements || [] // NEW: Viral elements from optimization
          })),
          viralMetadata: {
            trends: trendResult.data?.trends || [],
            optimizations: viralOptResult.data?.optimizations || {},
            targetPlatform: 'tiktok'
          }
        }
      }).catch(err => console.error('Video generation error:', err));

      productionSteps.push({
        step: 'Viral Video Generation',
        status: 'started',
        result: { message: 'Ultra-fast viral-optimized generation started' }
      });

      console.log(`✅ Viral video generation started (${Date.now() - startTime}ms)`);
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
        total_time_ms: totalTime,
        viral_intelligence: true,
        trends_detected: trendResult.data?.trends?.length || 0,
        viral_score: viralOptResult.data?.predicted_viral_score || 0
      }
    });

    console.log(`⚡ VIRAL PRODUCTION COMPLETE: ${totalTime}ms (${(totalTime/1000).toFixed(2)}s) - Success rate: ${successRate}%`);
    console.log(`📊 Viral Intelligence: ${trendResult.data?.trends?.length || 0} trends detected, ${viralOptResult.data?.predicted_viral_score || 0}/100 viral score`);

    return new Response(
      JSON.stringify({
        success: true,
        episodeId,
        productionSteps,
        successRate,
        totalTimeMs: totalTime,
        totalTimeSec: (totalTime/1000).toFixed(2),
        parallelExecution: true,
        viralIntelligence: {
          trendsDetected: trendResult.data?.trends?.length || 0,
          viralScore: viralOptResult.data?.predicted_viral_score || 0,
          optimizationsApplied: Object.keys(viralOptResult.data?.optimizations || {}).length
        },
        message: `⚡ Episode produced in ${(totalTime/1000).toFixed(2)}s with VIRAL INTELLIGENCE. Video rendering in progress.`,
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