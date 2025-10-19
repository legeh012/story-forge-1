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

    const { campaign_type, topic } = await req.json();

    // Get user's active bots
    const { data: bots, error: botsError } = await supabase
      .from('viral_bots')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (botsError) throw botsError;

    const orchestrationSteps = [];

    // Orchestrate multi-bot campaign
    if (campaign_type === 'full_viral_campaign') {
      // Step 1: Generate trending content ideas
      const trendBot = bots.find(b => b.bot_type === 'trend_detection');
      if (trendBot) {
        orchestrationSteps.push({
          bot: 'Trend Detection',
          action: 'Analyze trending topics',
          status: 'queued'
        });
      }

      // Step 2: Generate script
      const scriptBot = bots.find(b => b.bot_type === 'script_generator');
      if (scriptBot) {
        orchestrationSteps.push({
          bot: 'Script Generator',
          action: 'Create viral script',
          status: 'queued'
        });
      }

      // Step 3: Optimize hooks
      const hookBot = bots.find(b => b.bot_type === 'hook_optimization');
      if (hookBot) {
        orchestrationSteps.push({
          bot: 'Hook Optimization',
          action: 'Optimize title and description',
          status: 'queued'
        });
      }

      // Step 4: Create remixes
      const remixBot = bots.find(b => b.bot_type === 'remix');
      if (remixBot) {
        orchestrationSteps.push({
          bot: 'Remix Bot',
          action: 'Generate content variations',
          status: 'queued'
        });
      }

      // Step 5: Cross-platform distribution
      const posterBot = bots.find(b => b.bot_type === 'cross_platform_poster');
      if (posterBot) {
        orchestrationSteps.push({
          bot: 'Cross-Platform Poster',
          action: 'Schedule posts across platforms',
          status: 'queued'
        });
      }

      // Step 6: Track performance
      const trackerBot = bots.find(b => b.bot_type === 'performance_tracker');
      if (trackerBot) {
        orchestrationSteps.push({
          bot: 'Performance Tracker',
          action: 'Monitor campaign metrics',
          status: 'queued'
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        campaign: campaign_type,
        topic,
        bots_activated: orchestrationSteps.length,
        execution_plan: orchestrationSteps,
        estimated_completion: '15-30 minutes',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Bot orchestrator error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
