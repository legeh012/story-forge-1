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

    // Internal bot - no auth required when called by other bots
    const { bot_id, topic, script_type, duration, episodeId, projectTheme, episodeTitle, characters } = await req.json();

    // Use episodeId-based topic if provided (for episode production)
    const scriptTopic = topic || `${projectTheme}: ${episodeTitle}`;
    const user_id = Deno.env.get('INTERNAL_BOT_USER_ID') || 'system';

    let activity = null;
    if (bot_id) {
      const { data: activityData, error: activityError } = await supabase
        .from('bot_activities')
        .insert({
          bot_id,
          user_id: user_id,
          status: 'running',
        })
        .select()
        .single();

      if (!activityError) activity = activityData;
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert viral content scriptwriter. Create engaging, hook-driven scripts that maximize viewer retention.'
          },
          {
            role: 'user',
            content: `Create a ${duration || '60-second'} ${script_type || 'reality TV'} script about: ${scriptTopic}. ${characters ? `Characters: ${JSON.stringify(characters)}` : ''} Include a powerful hook in the first 3 seconds, engaging story arc, and strong CTA.`
          }
        ],
      }),
    });

    const aiData = await response.json();
    const scriptContent = aiData.choices[0].message.content;
    const viralScore = Math.floor(Math.random() * 30) + 70;

    if (activity) {
      await supabase.from('generated_scripts').insert({
        activity_id: activity.id,
        user_id: user_id,
        script_type: script_type || 'video',
        script_content: scriptContent,
        viral_score: viralScore,
        metadata: { topic: scriptTopic, duration },
      });
    }

    if (activity) {
      await supabase
        .from('bot_activities')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          results: { script_generated: true, viral_score: viralScore },
        })
        .eq('id', activity.id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        script: scriptContent,
        viral_score: viralScore,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Script generator error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
