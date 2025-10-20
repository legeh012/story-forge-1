import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  projectId: string;
  prompt: string;
  episodeNumber?: number;
  duration?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Episode Generation from Prompt Started ===');
    
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { projectId, prompt, episodeNumber, duration = 180 }: GenerateRequest = await req.json();

    if (!projectId || !prompt) {
      throw new Error('Project ID and prompt are required');
    }

    console.log(`Generating ${duration}s episode for project: ${projectId}`);

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found');
    }

    // Get characters for context
    const { data: characters } = await supabase
      .from('characters')
      .select('name, role, personality')
      .eq('project_id', projectId);

    // Use Turbo Script Bot for ultra-fast script generation with duration
    console.log(`🚀 Activating TURBO Script Bot for ${duration}s video...`);
    
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const scriptBotResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/turbo-script-bot`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          projectContext: {
            title: project.title,
            genre: project.genre,
            mood: project.mood,
            description: project.description,
            characters: characters?.map(c => ({
              name: c.name,
              role: c.role,
              personality: c.personality
            })) || []
          },
          episodeNumber: episodeNumber ?? 1,
          duration: duration,
          customPrompt: prompt
        })
      }
    );

    if (!scriptBotResponse.ok) {
      const errorText = await scriptBotResponse.text();
      throw new Error(`Turbo Script Bot failed: ${errorText}`);
    }

    const scriptData = await scriptBotResponse.json();
    const { script } = scriptData;
    
    console.log(`✅ TURBO Script generated for ${duration}s video`);

    // Determine episode number
    const { count } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    const nextEpisodeNumber = episodeNumber ?? (count || 0) + 1;

    // Create episode with generated content
    const { data: newEpisode, error: episodeError } = await supabase
      .from('episodes')
      .insert({
        project_id: projectId,
        user_id: user.id,
        episode_number: nextEpisodeNumber,
        season: 1,
        title: script.title,
        synopsis: script.synopsis,
        storyboard: script.storyboard,
        status: 'draft',
        video_status: 'not_started'
      })
      .select()
      .single();

    if (episodeError) {
      throw new Error(`Failed to create episode: ${episodeError.message}`);
    }

    console.log(`Episode created: ${newEpisode.id}`);

    // Orchestrate bots in parallel for ultra-fast production
    console.log('🤖 Orchestrating AI bot team in PARALLEL mode...');
    
    const botPromises = [
      // Activate bot orchestrator
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/bot-orchestrator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          campaignType: 'full_viral_campaign',
          topic: script.title,
          episodeId: newEpisode.id,
          projectId: projectId
        })
      })
    ];

    await Promise.allSettled(botPromises);
    console.log('✅ Bot orchestration activated');

    // Start parallel video generation immediately
    console.log('🎬 Starting PARALLEL video generation...');
    
    const videoGenPromise = fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ episodeId: newEpisode.id })
    });

    // Video generation is already triggered above - just return success
    return new Response(
      JSON.stringify({
        success: true,
        episode: {
          id: newEpisode.id,
          title: newEpisode.title,
          synopsis: newEpisode.synopsis,
          clipCount: script.storyboard.length
        },
        message: 'Episode generated successfully! Video generation in progress.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      }
    );


  } catch (error) {
    console.error('Episode generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
