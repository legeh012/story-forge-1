import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  projectId: string;
  prompt: string;
  episodeNumber?: number;
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

    const { projectId, prompt, episodeNumber }: GenerateRequest = await req.json();

    if (!projectId || !prompt) {
      throw new Error('Project ID and prompt are required');
    }

    console.log(`Generating episode for project: ${projectId}`);

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

    // Generate episode content using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating episode script and structure...');

    const systemPrompt = `You are an expert TV show writer and producer. Generate a complete episode structure with exactly 3 clips/scenes.

Format your response as JSON with this structure:
{
  "title": "Episode title",
  "synopsis": "Brief episode summary (1-2 sentences)",
  "script": "Full episode script with all dialogue and action",
  "clips": [
    {
      "description": "Detailed visual description for clip 1 (what should be shown)",
      "duration": duration in seconds,
      "dialogue": "Key dialogue for this clip"
    },
    {
      "description": "Detailed visual description for clip 2",
      "duration": duration in seconds,
      "dialogue": "Key dialogue for this clip"
    },
    {
      "description": "Detailed visual description for clip 3",
      "duration": duration in seconds,
      "dialogue": "Key dialogue for this clip"
    }
  ]
}

Make the clips cinematic and suitable for ${project.genre || 'reality TV'}. Total duration should be 60-90 seconds across all 3 clips.`;

    const userPrompt = `Create an episode for "${project.title}" with this prompt: ${prompt}

Project details:
- Genre: ${project.genre || 'Not specified'}
- Mood: ${project.mood || 'Not specified'}
- Theme: ${project.theme || 'Not specified'}
- Description: ${project.description || 'Not specified'}

Generate 3 compelling clips that tell a complete story.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI generation failed:', aiResponse.status, errorText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content generated');
    }

    console.log('Episode content generated');

    // Parse the JSON response
    let episodeData;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      episodeData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse episode data');
    }

    // Determine episode number
    const { count } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    const nextEpisodeNumber = episodeNumber ?? (count || 0) + 1;

    // Create episode in database
    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .insert({
        user_id: user.id,
        project_id: projectId,
        title: episodeData.title,
        synopsis: episodeData.synopsis,
        episode_number: nextEpisodeNumber,
        season: 1,
        script: episodeData.script,
        storyboard: episodeData.clips,
        status: 'draft',
        video_status: 'not_started',
        rendering_style: 'photorealistic'
      })
      .select()
      .single();

    if (episodeError) {
      console.error('Episode creation error:', episodeError);
      throw episodeError;
    }

    console.log(`Episode created: ${episode.id}`);

    // Orchestrate AI bots for full viral production
    console.log('🤖 Orchestrating AI bot team...');
    
    const { data: botData, error: botError } = await supabase.functions.invoke('bot-orchestrator', {
      body: {
        campaign_type: 'full_viral_campaign',
        topic: prompt,
        episodeId: episode.id,
        projectId: projectId
      }
    });

    if (botError) {
      console.warn('Bot orchestration warning:', botError);
    } else {
      console.log(`✅ Activated ${botData?.activatedBots || 0} AI bots for viral optimization`);
    }

    // Now generate video clips
    console.log('Starting video generation for clips...');

    const { data: videoData, error: videoError } = await supabase.functions.invoke('generate-video', {
      body: {
        episodeId: episode.id,
        scenes: episodeData.clips.map((clip: any) => ({
          description: clip.description,
          duration: clip.duration,
          dialogue: clip.dialogue
        }))
      }
    });

    if (videoError) {
      console.error('Video generation error:', videoError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        episode: {
          id: episode.id,
          title: episode.title,
          synopsis: episode.synopsis,
          clipCount: episodeData.clips.length
        },
        message: 'Episode generated successfully! Video clips are being created in the background.'
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
