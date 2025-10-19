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

    const { bot_id, content, platforms, media_urls, scheduled_time } = await req.json();

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

    const platformList = platforms || ['youtube', 'tiktok', 'instagram', 'twitter', 'linkedin'];
    const scheduledPosts = [];

    for (const platform of platformList) {
      const { error: postError } = await supabase.from('scheduled_posts').insert({
        activity_id: activity.id,
        user_id: user.id,
        platform,
        content,
        media_urls: media_urls || [],
        scheduled_time: scheduled_time || new Date().toISOString(),
        status: 'pending',
        metadata: { created_via: 'cross_platform_poster' },
      });

      if (!postError) {
        scheduledPosts.push({ platform, status: 'scheduled' });
      }
    }

    await supabase
      .from('bot_activities')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        results: { platforms_scheduled: scheduledPosts.length },
      })
      .eq('id', activity.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        scheduled_posts: scheduledPosts,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Cross-platform poster error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
