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

    const { bot_id, content_id, platforms } = await req.json();

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

    const platformList = platforms || ['youtube', 'tiktok', 'instagram'];
    const metrics = [];

    for (const platform of platformList) {
      // Simulate tracking metrics - in production, integrate with platform APIs
      const metric = {
        content_id: content_id || `content_${Date.now()}`,
        platform,
        views: Math.floor(Math.random() * 100000),
        watch_time: Math.floor(Math.random() * 50000),
        ctr: (Math.random() * 0.15).toFixed(4),
        retention_rate: (0.4 + Math.random() * 0.4).toFixed(4),
        engagement_rate: (0.05 + Math.random() * 0.15).toFixed(4),
        conversions: Math.floor(Math.random() * 500),
        revenue: (Math.random() * 1000).toFixed(2),
      };

      await supabase.from('performance_metrics').insert({
        activity_id: activity.id,
        user_id: user.id,
        ...metric,
        metadata: { tracked_at: new Date().toISOString() },
      });

      metrics.push(metric);
    }

    await supabase
      .from('bot_activities')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        results: { platforms_tracked: platformList.length, total_views: metrics.reduce((sum, m) => sum + m.views, 0) },
      })
      .eq('id', activity.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        metrics,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Performance tracker error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
