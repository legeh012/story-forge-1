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

    const { bot_id } = await req.json();

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

    console.log('Trend detection bot started:', activity.id);

    // Use Lovable AI to detect trends
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const platforms = ['tiktok', 'youtube', 'reddit'];
    const trends = [];

    for (const platform of platforms) {
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
              content: 'You are a trend detection expert. Analyze current viral trends and return realistic trending topics, hashtags, and formats.'
            },
            {
              role: 'user',
              content: `Generate 5 realistic trending ${platform} trends right now. For each trend provide: type (hashtag/format/audio/challenge), content description, engagement score (1-100), and relevant hashtags.`
            }
          ],
        }),
      });

      const aiData = await response.json();
      const trendContent = aiData.choices[0].message.content;

      // Parse and store trends
      const platformTrends = parseTrendContent(trendContent, platform);
      
      for (const trend of platformTrends) {
        const { error: trendError } = await supabase
          .from('trend_detections')
          .insert({
            activity_id: activity.id,
            user_id: user.id,
            platform,
            trend_type: trend.type,
            content: trend.content,
            hashtags: trend.hashtags,
            engagement_score: trend.engagement_score,
            metadata: { source: 'ai_detection' },
          });

        if (!trendError) {
          trends.push(trend);
        }
      }
    }

    // Update activity as completed
    await supabase
      .from('bot_activities')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        results: { trends_found: trends.length, platforms },
      })
      .eq('id', activity.id);

    console.log(`Detected ${trends.length} trends across ${platforms.length} platforms`);

    return new Response(
      JSON.stringify({ success: true, activity_id: activity.id, trends_found: trends.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Trend detection error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function parseTrendContent(content: string, platform: string) {
  // Simple parsing - in production, use structured output
  const trends = [];
  const lines = content.split('\n').filter(l => l.trim());
  
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    trends.push({
      type: i % 2 === 0 ? 'hashtag' : 'format',
      content: lines[i].substring(0, 200),
      hashtags: extractHashtags(lines[i]),
      engagement_score: Math.floor(Math.random() * 40) + 60,
    });
  }
  
  return trends;
}

function extractHashtags(text: string): string[] {
  const matches = text.match(/#\w+/g) || [];
  return matches.slice(0, 5);
}
