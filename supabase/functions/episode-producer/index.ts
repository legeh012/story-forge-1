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

    // Step 1: Script Generation
    console.log('Step 1: Generating script...');
    const scriptResult = await supabase.functions.invoke('script-generator-bot', {
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
    });

    productionSteps.push({
      step: 'Script Generation',
      status: scriptResult.error ? 'failed' : 'completed',
      result: scriptResult.data
    });

    if (scriptResult.error) {
      console.error('Script generation failed:', scriptResult.error);
    }

    // Step 2: Cultural Injection
    console.log('Step 2: Adding cultural elements...');
    const culturalResult = await supabase.functions.invoke('cultural-injection-bot', {
      body: {
        script: scriptResult.data?.script || episode.script,
        genre: project.genre,
        theme: project.theme
      }
    });

    productionSteps.push({
      step: 'Cultural Injection',
      status: culturalResult.error ? 'failed' : 'completed',
      result: culturalResult.data
    });

    // Step 3: Expert Direction
    console.log('Step 3: Getting cinematic direction...');
    const directionResult = await supabase.functions.invoke('expert-director', {
      body: {
        prompt: `Direct a reality TV scene for "${episode.title}" with dramatic pacing and strong character moments`,
        episodeId: episodeId
      }
    });

    productionSteps.push({
      step: 'Expert Direction',
      status: directionResult.error ? 'failed' : 'completed',
      result: directionResult.data
    });

    // Step 4: Scene Orchestration
    console.log('Step 4: Orchestrating scenes...');
    const sceneResult = await supabase.functions.invoke('scene-orchestration', {
      body: {
        episodeId,
        script: culturalResult.data?.injected_content || scriptResult.data?.script,
        direction: directionResult.data?.direction,
        characters
      }
    });

    productionSteps.push({
      step: 'Scene Orchestration',
      status: sceneResult.error ? 'failed' : 'completed',
      result: sceneResult.data
    });

    // Step 5: Hook Optimization
    console.log('Step 5: Optimizing hooks...');
    const hookResult = await supabase.functions.invoke('hook-optimization-bot', {
      body: {
        title: episode.title,
        description: episode.synopsis,
        genre: project.genre
      }
    });

    productionSteps.push({
      step: 'Hook Optimization',
      status: hookResult.error ? 'failed' : 'completed',
      result: hookResult.data
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

    // Step 7: Trigger video generation with actual scenes
    console.log('Step 7: Generating video...');
    const scenes = sceneResult.data?.scenes || [];
    
    if (scenes.length > 0) {
      const videoResult = await supabase.functions.invoke('generate-video', {
        body: {
          episodeId,
          scenes: scenes.map((scene: any) => ({
            description: scene.description || scene.visual_description || 'Scene from the episode',
            duration: scene.duration || 5,
            dialogue: scene.dialogue || scene.voiceover
          }))
        }
      });

      productionSteps.push({
        step: 'Video Generation',
        status: videoResult.error ? 'failed' : 'started',
        result: videoResult.data
      });

      if (videoResult.error) {
        console.error('Video generation error:', videoResult.error);
      }
    } else {
      console.log('No scenes available for video generation');
      productionSteps.push({
        step: 'Video Generation',
        status: 'skipped',
        result: { message: 'No scenes available' }
      });
    }

    // Log execution stats
    const completedSteps = productionSteps.filter(s => s.status === 'completed' || s.status === 'started').length;
    const successRate = (completedSteps / productionSteps.length) * 100;

    await supabase.from('bot_execution_stats').insert({
      bot_type: 'production_team',
      episode_id: episodeId,
      quality_score: successRate,
      metadata: {
        steps: productionSteps,
        success_rate: successRate
      }
    });

    console.log(`Episode production completed. Success rate: ${successRate}%`);

    return new Response(
      JSON.stringify({
        success: true,
        episodeId,
        productionSteps,
        successRate,
        message: 'Episode production completed. Video generation started in background.',
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