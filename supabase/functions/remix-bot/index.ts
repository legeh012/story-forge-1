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
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { bot_id, source_content, remix_types } = await req.json();

    // Create activity record
    const { data: activity, error: activityError } = await supabase
      .from('bot_activities')
      .insert({
        bot_id,
        user_id: user.id,
        status: 'running',
      })
      .select()
      .single();

    if (activityError) throw activityError;

    console.log('Remix bot started:', activity.id);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const types = remix_types || ['meme', 'duet', 'reaction', 'cinematic'];
    const remixes = [];

    for (const remixType of types) {
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
              content: `You are a creative content remixer. Transform content into viral ${remixType} formats.`
            },
            {
              role: 'user',
              content: `Create a viral ${remixType} remix of this content: "${source_content}". Make it engaging, shareable, and on-trend.`
            }
          ],
        }),
      });

      const aiData = await response.json();
      const remixedContent = aiData.choices[0].message.content;

      const viralScore = Math.floor(Math.random() * 30) + 70;

      const { error: remixError } = await supabase
        .from('content_remixes')
        .insert({
          activity_id: activity.id,
          user_id: user.id,
          source_content,
          remix_type: remixType,
          remixed_content: remixedContent.substring(0, 1000),
          viral_score: viralScore,
          metadata: { ai_generated: true },
        });

      if (!remixError) {
        remixes.push({ type: remixType, score: viralScore });
      }
    }

    // Update activity
    await supabase
      .from('bot_activities')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        results: { remixes_created: remixes.length },
      })
      .eq('id', activity.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        activity_id: activity.id,
        remixes_created: remixes.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Remix bot error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
