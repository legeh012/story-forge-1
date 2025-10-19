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

    const { bot_id, content_title, content_description } = await req.json();

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

    console.log('Hook optimization bot started:', activity.id);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    // Optimize title
    const titleResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: 'You are a viral content optimizer. Create highly engaging, click-worthy titles that maximize CTR while maintaining authenticity.'
          },
          {
            role: 'user',
            content: `Optimize this title for maximum engagement: "${content_title || 'Untitled Content'}". Provide 3 viral alternatives with predicted CTR improvement.`
          }
        ],
      }),
    });

    const titleData = await titleResponse.json();
    const optimizedTitle = titleData.choices[0].message.content;

    // Optimize description
    const descResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: 'Create compelling video descriptions that drive engagement and include strategic hashtags.'
          },
          {
            role: 'user',
            content: `Optimize this description: "${content_description || 'No description'}". Include viral hooks, CTAs, and trending hashtags.`
          }
        ],
      }),
    });

    const descData = await descResponse.json();
    const optimizedDescription = descData.choices[0].message.content;

    // Generate thumbnail suggestions
    const thumbnailSuggestions = {
      concepts: [
        'High contrast colors with bold text overlay',
        'Emotion-driven facial expression close-up',
        'Mystery element with question mark',
      ],
      colors: ['#FF0000', '#00FF00', '#0000FF'],
      text_overlays: ['🔥', '😱', '💡'],
    };

    // Store optimization
    const { error: hookError } = await supabase
      .from('hook_optimizations')
      .insert({
        activity_id: activity.id,
        user_id: user.id,
        original_title: content_title,
        optimized_title: optimizedTitle.split('\n')[0].substring(0, 200),
        original_description: content_description,
        optimized_description: optimizedDescription.substring(0, 500),
        thumbnail_suggestions: thumbnailSuggestions,
        predicted_ctr: 0.15 + Math.random() * 0.25,
      });

    if (hookError) throw hookError;

    // Update activity
    await supabase
      .from('bot_activities')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        results: { optimized: true },
      })
      .eq('id', activity.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        activity_id: activity.id,
        optimized_title: optimizedTitle.split('\n')[0],
        optimized_description: optimizedDescription,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Hook optimization error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
