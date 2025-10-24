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

    const { operation, target, data: requestData } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    console.log('🔧 BaaS Bot: Managing backend infrastructure...');

    const startTime = Date.now();

    const baasPrompt = `You are a BaaS (Backend as a Service) AI bot managing backend infrastructure.

Operation: ${operation}
Target: ${target}
Data: ${JSON.stringify(requestData)}

Your responsibilities:
- Database optimization and queries
- Storage management (files, media)
- Authentication and security
- API rate limiting and caching
- Data backup and recovery

Provide an infrastructure action plan in JSON:
{
  "backend_actions": ["action1", "action2"],
  "database_operations": ["op1"],
  "storage_tasks": ["task1"],
  "security_measures": ["measure1"],
  "performance_impact": "low/medium/high"
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: baasPrompt }],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('BaaS AI processing failed');
    }

    const aiData = await aiResponse.json();
    const infraPlan = JSON.parse(
      aiData.choices[0].message.content.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    );

    const executionTime = Date.now() - startTime;

    // Log service operation
    await supabase.from('service_operations').insert({
      service_id: null,
      operation_type: operation,
      status: 'completed',
      input_data: { target, ...requestData },
      output_data: infraPlan,
      execution_time_ms: executionTime,
      user_id: user.id,
      completed_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({
      success: true,
      service: 'BaaS',
      infrastructure_plan: infraPlan,
      execution_time_ms: executionTime,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('BaaS Bot Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
