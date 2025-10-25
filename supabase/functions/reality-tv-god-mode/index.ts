import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductionPhase {
  name: string;
  bots: string[];
  parallel: boolean;
}

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

    const { episodeId, projectId, mode = 'ultra' } = await req.json();

    console.log(`🎬 GOD MODE ACTIVATED: ${mode.toUpperCase()}`);
    console.log(`Episode ID: ${episodeId}, Project ID: ${projectId}`);

    // Fetch episode and project data
    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', episodeId)
      .single();

    if (episodeError || !episode) throw new Error('Episode not found');

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) throw new Error('Project not found');

    const { data: characters } = await supabase
      .from('characters')
      .select('*')
      .eq('project_id', projectId);

    // Update episode status
    await supabase
      .from('episodes')
      .update({ 
        video_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', episodeId);

    // Define production phases based on mode
    const productionPipeline: ProductionPhase[] = mode === 'ultra' ? [
      {
        name: 'Phase 1: Viral Intelligence & Script Enhancement',
        bots: ['trend-detection-bot', 'turbo-script-bot', 'hook-optimization-bot'],
        parallel: true
      },
      {
        name: 'Phase 2: Cultural & Creative Direction',
        bots: ['cultural-injection-bot', 'expert-director', 'scene-orchestration'],
        parallel: true
      },
      {
        name: 'Phase 3: Production Excellence',
        bots: ['production-team', 'godlike-voice-bot', 'audio-mixer-bot'],
        parallel: true
      },
      {
        name: 'Phase 4: Video Generation',
        bots: ['ultra-video-bot'],
        parallel: false
      },
      {
        name: 'Phase 5: Post-Production & Distribution',
        bots: ['remix-bot', 'cross-platform-poster', 'youtube-uploader'],
        parallel: true
      }
    ] : [
      {
        name: 'Standard Production',
        bots: ['turbo-script-bot', 'expert-director', 'ultra-video-bot'],
        parallel: false
      }
    ];

    const executionLog = [];
    let enhancedEpisode = { ...episode };

    // Execute each phase
    for (const phase of productionPipeline) {
      console.log(`\n🚀 Executing: ${phase.name}`);
      const phaseStartTime = Date.now();

      if (phase.parallel) {
        // Execute bots in parallel
        const botPromises = phase.bots.map(async (botName) => {
          try {
            const botStartTime = Date.now();
            console.log(`  ⚡ Starting bot: ${botName}`);

            const botPayload = prepareBotPayload(botName, {
              episode: enhancedEpisode,
              project,
              characters,
              userId: user.id
            });

            const { data: botResult, error: botError } = await supabase.functions.invoke(botName, {
              body: botPayload
            });

            const botDuration = Date.now() - botStartTime;

            if (botError) {
              console.error(`  ❌ ${botName} failed:`, botError);
              return { bot: botName, status: 'failed', error: botError.message, duration: botDuration };
            }

            console.log(`  ✅ ${botName} completed in ${botDuration}ms`);
            
            // Update enhanced episode with bot results
            if (botResult) {
              enhancedEpisode = mergeBotResults(enhancedEpisode, botName, botResult);
            }

            return { bot: botName, status: 'success', data: botResult, duration: botDuration };
          } catch (error) {
            console.error(`  💥 ${botName} crashed:`, error);
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            return { bot: botName, status: 'crashed', error: errorMsg };
          }
        });

        const results = await Promise.all(botPromises);
        const phaseDuration = Date.now() - phaseStartTime;

        executionLog.push({
          phase: phase.name,
          parallel: true,
          duration: phaseDuration,
          results
        });

        console.log(`  🎯 ${phase.name} completed in ${phaseDuration}ms`);
      } else {
        // Execute bots sequentially
        for (const botName of phase.bots) {
          try {
            const botStartTime = Date.now();
            console.log(`  ⚡ Starting bot: ${botName}`);

            const botPayload = prepareBotPayload(botName, {
              episode: enhancedEpisode,
              project,
              characters,
              userId: user.id
            });

            const { data: botResult, error: botError } = await supabase.functions.invoke(botName, {
              body: botPayload
            });

            const botDuration = Date.now() - botStartTime;

            if (botError) {
              console.error(`  ❌ ${botName} failed:`, botError);
              executionLog.push({
                phase: phase.name,
                bot: botName,
                status: 'failed',
                error: botError.message,
                duration: botDuration
              });
              continue;
            }

            console.log(`  ✅ ${botName} completed in ${botDuration}ms`);
            
            if (botResult) {
              enhancedEpisode = mergeBotResults(enhancedEpisode, botName, botResult);
            }

            executionLog.push({
              phase: phase.name,
              bot: botName,
              status: 'success',
              data: botResult,
              duration: botDuration
            });
          } catch (error) {
            console.error(`  💥 ${botName} crashed:`, error);
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            executionLog.push({
              phase: phase.name,
              bot: botName,
              status: 'crashed',
              error: errorMsg
            });
          }
        }
      }
    }

    // Update episode with all enhancements
    const { error: updateError } = await supabase
      .from('episodes')
      .update({
        script: enhancedEpisode.script || episode.script,
        synopsis: enhancedEpisode.synopsis || episode.synopsis,
        storyboard: enhancedEpisode.storyboard || episode.storyboard,
        video_status: 'completed',
        video_url: enhancedEpisode.video_url,
        metadata: {
          ...episode.metadata,
          production_mode: mode,
          god_mode_execution: executionLog,
          enhanced_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', episodeId);

    if (updateError) {
      console.error('Failed to update episode:', updateError);
    }

    // Log execution statistics
    await supabase.from('bot_execution_stats').insert({
      bot_name: 'reality-tv-god-mode',
      user_id: user.id,
      execution_time_ms: executionLog.reduce((sum, log) => sum + (log.duration || 0), 0),
      success: true,
      metadata: {
        mode,
        phases: productionPipeline.length,
        total_bots: executionLog.length,
        episode_id: episodeId,
        project_id: projectId
      }
    });

    console.log(`\n🎉 GOD MODE COMPLETE - Episode ${episodeId} processed`);

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        episodeId,
        executionLog,
        totalDuration: executionLog.reduce((sum, log) => sum + (log.duration || 0), 0),
        message: `🎬 God-level production complete! Episode processed through ${productionPipeline.length} phases with ${executionLog.length} bot executions.`,
        enhancedEpisode
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('God mode orchestrator error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function prepareBotPayload(botName: string, context: any) {
  const { episode, project, characters, userId } = context;

  // Create bot-specific payloads
  const payloads: Record<string, any> = {
    'trend-detection-bot': {
      topic: episode.title || project.title,
      niche: 'reality-tv-diaspora',
      userId
    },
    'turbo-script-bot': {
      projectId: project.id,
      episodeTitle: episode.title,
      synopsis: episode.synopsis,
      characters: characters || [],
      enhancementLevel: 'ultra'
    },
    'hook-optimization-bot': {
      title: episode.title,
      description: episode.synopsis,
      platform: 'youtube',
      userId
    },
    'cultural-injection-bot': {
      script: episode.script || episode.synopsis,
      culture: 'somali-diaspora',
      intensity: 'high',
      userId
    },
    'expert-director': {
      script: episode.script || episode.synopsis,
      style: 'reality-tv-cinematic',
      userId
    },
    'scene-orchestration': {
      shortPrompt: episode.synopsis,
      episodeId: episode.id,
      userId
    },
    'production-team': {
      episodeId: episode.id,
      projectId: project.id,
      role: 'director',
      userId
    },
    'godlike-voice-bot': {
      episodeId: episode.id,
      scenes: episode.storyboard?.scenes || [],
      userId
    },
    'audio-mixer-bot': {
      episodeId: episode.id,
      scenes: episode.storyboard?.scenes || [],
      enhancementLevel: 'premium',
      userId
    },
    'ultra-video-bot': {
      episodeId: episode.id,
      enhancementLevel: 'photorealistic',
      userId
    },
    'remix-bot': {
      episodeId: episode.id,
      platforms: ['tiktok', 'instagram', 'youtube-shorts'],
      userId
    },
    'cross-platform-poster': {
      episodeId: episode.id,
      platforms: ['youtube', 'tiktok', 'instagram'],
      scheduleTime: 'immediate',
      userId
    },
    'youtube-uploader': {
      videoUrl: episode.video_url,
      title: episode.title,
      description: episode.synopsis,
      episodeId: episode.id,
      userId
    }
  };

  return payloads[botName] || { episodeId: episode.id, userId };
}

function mergeBotResults(episode: any, botName: string, botResult: any) {
  const enhanced = { ...episode };

  // Merge results based on bot type
  if (botName === 'turbo-script-bot' && botResult.script) {
    enhanced.script = botResult.script;
  }

  if (botName === 'hook-optimization-bot' && botResult.optimizedTitle) {
    enhanced.title = botResult.optimizedTitle;
    enhanced.synopsis = botResult.optimizedDescription || enhanced.synopsis;
  }

  if (botName === 'cultural-injection-bot' && botResult.enhancedScript) {
    enhanced.script = botResult.enhancedScript;
  }

  if (botName === 'expert-director' && botResult.direction) {
    enhanced.storyboard = {
      ...enhanced.storyboard,
      direction: botResult.direction
    };
  }

  if (botName === 'scene-orchestration' && botResult.scenes) {
    enhanced.storyboard = {
      ...enhanced.storyboard,
      scenes: botResult.scenes
    };
  }

  if (botName === 'ultra-video-bot' && botResult.videoUrl) {
    enhanced.video_url = botResult.videoUrl;
  }

  if (botName === 'audio-mixer-bot' && botResult.audioUrl) {
    enhanced.audio_url = botResult.audioUrl;
  }

  // Store all bot results in metadata
  enhanced.metadata = {
    ...enhanced.metadata,
    [`${botName}_result`]: botResult
  };

  return enhanced;
}
