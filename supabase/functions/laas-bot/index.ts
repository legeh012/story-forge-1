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

    const { operation, timeframe, filters } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    console.log('📊 LaaS Bot: Analyzing logs and metrics...');

    const startTime = Date.now();

    // Fetch recent service operations for analysis
    const { data: recentOps } = await supabase
      .from('service_operations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Fetch service metrics
    const { data: metrics } = await supabase
      .from('service_metrics')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false })
      .limit(100);

    const laasPrompt = `You are a LaaS (Logging as a Service) AI bot analyzing system logs and metrics.

Operation: ${operation}
Timeframe: ${timeframe}
Recent Operations: ${JSON.stringify(recentOps?.slice(0, 10))}
Metrics Sample: ${JSON.stringify(metrics?.slice(0, 20))}

Your responsibilities:
- Log aggregation and analysis
- Performance monitoring
- Error detection and alerting
- Usage analytics
- Anomaly detection

Provide an analytics report in JSON:
{
  "summary": "Overall system health summary",
  "insights": ["insight1", "insight2"],
  "anomalies": ["anomaly1"],
  "recommendations": ["rec1", "rec2"],
  "health_score": 95,
  "trending_issues": []
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: laasPrompt }],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('LaaS AI processing failed');
    }

    const aiData = await aiResponse.json();
    const analyticsReport = JSON.parse(
      aiData.choices[0].message.content.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    );

    const executionTime = Date.now() - startTime;

    // Record metrics
    await supabase.from('service_metrics').insert({
      service_id: null,
      metric_type: 'system_health',
      metric_value: analyticsReport.health_score,
      metadata: analyticsReport,
      user_id: user.id,
    });

    return new Response(JSON.stringify({
      success: true,
      service: 'LaaS',
      analytics_report: analyticsReport,
      operations_analyzed: recentOps?.length || 0,
      metrics_analyzed: metrics?.length || 0,
      execution_time_ms: executionTime,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('LaaS Bot Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
