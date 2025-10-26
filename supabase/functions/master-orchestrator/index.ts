import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MasterOrchestrationRequest {
  task: 'full_production' | 'episode_generation' | 'music_production' | 'video_enhancement' | 'viral_optimization';
  episodeId?: string;
  projectId?: string;
  characterId?: string;
  customInstructions?: string;
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

    const { task, episodeId, projectId, characterId, customInstructions } = await req.json() as MasterOrchestrationRequest;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    console.log(`🎬 Master Orchestrator: Coordinating ${task} production`);

    // Define complete bot ecosystem
    const availableBots = {
      // Content Creation Bots
      scriptGenerator: { function: 'script-generator-bot', priority: 1 },
      trendDetection: { function: 'trend-detection-bot', priority: 1 },
      culturalInjection: { function: 'cultural-injection-bot', priority: 2 },
      
      // Direction & Planning Bots
      expertDirector: { function: 'expert-director', priority: 3 },
      productionTeam: { function: 'production-team', priority: 3 },
      sceneOrchestration: { function: 'scene-orchestration', priority: 4 },
      episodeProducer: { function: 'episode-producer', priority: 4 },
      
      // Artlist Advanced Bots (5 modes)
      artlistSceneAnalysis: { function: 'artlist-advanced-bot', mode: 'scene_analysis', priority: 5 },
      artlistColorGrade: { function: 'artlist-advanced-bot', mode: 'color_grade', priority: 6 },
      artlistSmartEdit: { function: 'artlist-advanced-bot', mode: 'smart_editing', priority: 6 },
      artlistOptimization: { function: 'artlist-advanced-bot', mode: 'content_optimization', priority: 7 },
      artlistFullProduction: { function: 'artlist-advanced-bot', mode: 'full_production', priority: 10 },
      
      // Music Production Bot
      sunoMusicGenerator: { function: 'suno-music-generator', priority: 5 },
      audioMixer: { function: 'audio-mixer-bot', priority: 8 },
      godlikeVoice: { function: 'godlike-voice-bot', priority: 7 },
      soundEffects: { function: 'sound-effects-bot', priority: 8 },
      
      // Video Generation Bots
      ultraVideoBot: { function: 'ultra-video-bot', priority: 9 },
      godLevelFFmpeg: { function: 'god-level-ffmpeg-compiler', priority: 10 },
      godLevelVmaker: { function: 'god-level-vmaker-bot', priority: 10 },
      godLevelBingAI: { function: 'god-level-bing-ai-bot', priority: 10 },
      realityTvGodMode: { function: 'reality-tv-god-mode', priority: 11 },
      
      // Optimization Bots
      hookOptimization: { function: 'hook-optimization-bot', priority: 2 },
      performanceOptimizer: { function: 'performance-optimizer-bot', priority: 7 },
      
      // Distribution Bots
      remixBot: { function: 'remix-bot', priority: 12 },
      crossPlatformPoster: { function: 'cross-platform-poster', priority: 13 },
      performanceTracker: { function: 'performance-tracker-bot', priority: 14 },
    };

    // AI-driven orchestration plan
    const orchestrationPlan = await generateOrchestrationPlan(
      LOVABLE_API_KEY,
      task,
      availableBots,
      customInstructions
    );

    console.log('📋 Orchestration Plan:', orchestrationPlan);

    // Execute orchestration in parallel batches
    const results = await executeOrchestration(
      supabase,
      orchestrationPlan,
      episodeId,
      projectId,
      characterId,
      user.id
    );

    // Log orchestration event
    await supabase.from('orchestration_events').insert({
      event_type: 'master_orchestration',
      services_involved: orchestrationPlan.botSequence.map((b: any) => b.bot),
      decision_reasoning: orchestrationPlan.reasoning,
      actions_taken: results,
      user_id: user.id,
      success: true,
    });

    return new Response(JSON.stringify({
      success: true,
      task,
      orchestrationPlan,
      results,
      timestamp: new Date().toISOString(),
      message: `Master Orchestrator completed ${task} with ${results.length} bots`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Master Orchestrator Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateOrchestrationPlan(
  apiKey: string,
  task: string,
  availableBots: any,
  customInstructions?: string
): Promise<any> {
  const botsList = Object.entries(availableBots).map(([name, config]: [string, any]) => 
    `${name} (priority: ${config.priority}, function: ${config.function}${config.mode ? `, mode: ${config.mode}` : ''})`
  ).join('\n');

  const prompt = `You are the Master Orchestrator for a reality TV production system.

Task: ${task}
Custom Instructions: ${customInstructions || 'None'}

Available Bots:
${botsList}

Create an intelligent orchestration plan that delegates work to the appropriate bots.

For full_production:
- Use trend detection and script generation first
- Add cultural injection and expert director for narrative
- Use Artlist bots for professional video enhancement (scene analysis, color grade, smart editing)
- Add Suno music generator for character themes
- Use video generation bots (ultra-video-bot, reality-tv-god-mode)
- Finish with optimization and distribution

For music_production:
- Focus on Suno music generator, godlike voice, audio mixer, sound effects

For video_enhancement:
- Use all 5 Artlist modes for professional polish

For viral_optimization:
- Use trend detection, hook optimization, Artlist content optimization, remix bot

Return JSON:
{
  "reasoning": "Why this sequence is optimal",
  "estimatedTime": "time in minutes",
  "botSequence": [
    {"bot": "botName", "function": "function-name", "mode": "optional-mode", "parallel": false},
    ...
  ],
  "parallelBatches": [[batch1 bots], [batch2 bots]],
  "expectedOutputs": ["output1", "output2"]
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) throw new Error('Failed to generate orchestration plan');

  const data = await response.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
}

async function executeOrchestration(
  supabase: any,
  plan: any,
  episodeId?: string,
  projectId?: string,
  characterId?: string,
  userId?: string
): Promise<any[]> {
  const results = [];
  
  // Execute in parallel batches for efficiency
  for (const batch of plan.parallelBatches || []) {
    const batchPromises = batch.map(async (botConfig: any) => {
      const startTime = Date.now();
      
      try {
        const payload: any = {
          episodeId,
          projectId,
          characterId,
        };

        // Add mode for Artlist bots
        if (botConfig.mode) {
          payload.mode = botConfig.mode;
        }

        // Invoke the bot function
        const { data, error } = await supabase.functions.invoke(botConfig.function, {
          body: payload,
        });

        const executionTime = Date.now() - startTime;

        // Log bot execution
        await supabase.from('bot_execution_stats').insert({
          bot_type: botConfig.bot,
          episode_id: episodeId,
          execution_time_ms: executionTime,
          quality_score: 0.9,
          metadata: { 
            orchestrated: true, 
            mode: botConfig.mode,
            success: !error 
          },
        });

        return {
          bot: botConfig.bot,
          function: botConfig.function,
          mode: botConfig.mode,
          status: error ? 'failed' : 'completed',
          executionTime,
          error: error?.message,
          result: data,
        };
      } catch (error) {
        return {
          bot: botConfig.bot,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}
