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

    const { bot_id, original_content, injection_types } = await req.json();

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

    console.log('Cultural injection bot started:', activity.id);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const types = injection_types || ['humor', 'controversy', 'cultural_reference', 'trending_meme'];
    const injections = [];

    for (const injectionType of types) {
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
              content: `You are a cultural content expert. Inject ${injectionType} elements to make content more engaging and viral.`
            },
            {
              role: 'user',
              content: `Add ${injectionType} to this content to boost engagement: "${original_content}". Keep it relevant, timely, and shareable.`
            }
          ],
        }),
      });

      const aiData = await response.json();
      const injectedContent = aiData.choices[0].message.content;

      const relevanceScore = Math.floor(Math.random() * 30) + 70;

      const { error: injectionError } = await supabase
        .from('cultural_injections')
        .insert({
          activity_id: activity.id,
          user_id: user.id,
          original_content,
          injection_type: injectionType,
          injected_content: injectedContent.substring(0, 1000),
          cultural_relevance_score: relevanceScore,
          metadata: { ai_generated: true, timestamp: new Date().toISOString() },
        });

      if (!injectionError) {
        injections.push({ type: injectionType, score: relevanceScore });
      }
    }

    // Update activity
    await supabase
      .from('bot_activities')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        results: { injections_created: injections.length },
      })
      .eq('id', activity.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        activity_id: activity.id,
        injections_created: injections.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Cultural injection error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
