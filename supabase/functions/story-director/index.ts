import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DirectorRequest {
  projectId: string;
  episodeId?: string;
  command: string;
  context?: any;
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

    const { projectId, episodeId, command, context } = await req.json() as DirectorRequest;

    console.log('🎬 Story Director activated:', { command, projectId, episodeId });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    // Fetch project and episode context
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    const { data: episode } = episodeId ? await supabase
      .from('episodes')
      .select('*')
      .eq('id', episodeId)
      .single() : { data: null };

    // Story Director orchestrates all specialized AI bots
    const systemPrompt = `You are the GOD-TIER Story Director AI - the supreme orchestrator of all AI bots.

YOUR SPECIALIZED BOT TEAM:
🧠 Character & Movement AI - Designs realistic characters with natural body language
🎧 SoundTrack AI - Creates emotionally resonant music and ambient soundscapes
🎥 Cinematography AI - Masters camera angles, lighting, scene transitions
🗣️ Dialogue AI - Generates culturally nuanced, authentic speech
💻 Post-Production AI - Handles editing, effects, and final polish
📈 Marketing & Analytics AI - Optimizes for virality and engagement

YOUR MISSION:
Analyze the user's command and orchestrate the perfect execution plan using your bot team.
For each request, determine:
1. Which specialized bots to activate
2. The exact sequence of operations
3. Parameters and settings for each bot
4. Success criteria and quality thresholds

Project Context: ${JSON.stringify(project || {})}
Episode Context: ${JSON.stringify(episode || {})}
Additional Context: ${JSON.stringify(context || {})}

USER COMMAND: ${command}

Provide a detailed orchestration plan in JSON format:
{
  "plan": "Overall strategy description",
  "bots": [
    {
      "name": "bot_name",
      "role": "specific role in this task",
      "function": "edge_function_to_call",
      "parameters": {},
      "priority": 1,
      "dependencies": []
    }
  ],
  "expectedOutputs": ["output1", "output2"],
  "qualityMetrics": {},
  "estimatedTime": "time estimate"
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: command }
        ],
        temperature: 0.9,
        max_tokens: 3000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error('AI gateway error');
    }

    const aiData = await aiResponse.json();
    const orchestrationPlan = aiData.choices[0].message.content;

    let parsedPlan;
    try {
      // Try to extract JSON from the response
      const jsonMatch = orchestrationPlan.match(/\{[\s\S]*\}/);
      parsedPlan = jsonMatch ? JSON.parse(jsonMatch[0]) : { plan: orchestrationPlan };
    } catch {
      parsedPlan = { plan: orchestrationPlan };
    }

    // Log the orchestration event
    await supabase.from('orchestration_events').insert({
      user_id: user.id,
      event_type: 'story_director_orchestration',
      services_involved: parsedPlan.bots?.map((b: any) => b.name) || [],
      actions_taken: parsedPlan,
      success: true,
      decision_reasoning: command
    });

    // Log bot activity
    await supabase.from('bot_activities').insert({
      user_id: user.id,
      bot_id: null,
      status: 'completed',
      results: {
        command,
        orchestration_plan: parsedPlan,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        orchestrationPlan: parsedPlan,
        director: '🎬 Story Director',
        message: 'Orchestration plan generated. Ready to execute with god-tier precision.',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Story Director error:', error);
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
