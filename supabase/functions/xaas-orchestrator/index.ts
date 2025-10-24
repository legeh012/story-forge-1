import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrchestrationRequest {
  task: string;
  context?: any;
  services?: string[];
}

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

    const { task, context, services = [] } = await req.json() as OrchestrationRequest;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    console.log('🎯 XaaS Orchestrator: Starting intelligent service coordination...');

    // AI decides which services to invoke and in what order
    const orchestrationPrompt = `You are an XaaS (Everything as a Service) orchestrator managing a cloud platform.

Available Services:
- SaaS (Software as a Service): Video generation, user management, content delivery
- PaaS (Platform as a Service): Deployment automation, scaling, environment management
- BaaS (Backend as a Service): Database operations, storage, authentication
- LaaS (Logging as a Service): System monitoring, analytics, error tracking

User Task: ${task}
Context: ${JSON.stringify(context)}

Analyze the task and create an intelligent orchestration plan. Return a JSON object with:
{
  "services_to_invoke": ["saas", "baas", etc],
  "execution_order": [{"service": "baas", "operation": "...", "priority": 1}, ...],
  "reasoning": "Why this approach is optimal",
  "estimated_time_ms": 5000,
  "dependencies": {"service1": ["service2", "service3"]}
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: orchestrationPrompt }],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI orchestration failed: ${await aiResponse.text()}`);
    }

    const aiData = await aiResponse.json();
    const orchestrationPlan = JSON.parse(
      aiData.choices[0].message.content.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    );

    console.log('📋 Orchestration Plan:', orchestrationPlan);

    // Log orchestration event
    await supabase.from('orchestration_events').insert({
      event_type: 'task_orchestration',
      services_involved: orchestrationPlan.services_to_invoke,
      decision_reasoning: orchestrationPlan.reasoning,
      actions_taken: orchestrationPlan.execution_order,
      user_id: user.id,
    });

    // Execute services in order (simplified - in production would invoke actual edge functions)
    const results = [];
    for (const step of orchestrationPlan.execution_order) {
      const operation = {
        service_type: step.service,
        operation: step.operation,
        status: 'simulated', // In production: invoke actual service edge functions
      };
      results.push(operation);
    }

    return new Response(JSON.stringify({
      success: true,
      orchestration_plan: orchestrationPlan,
      execution_results: results,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('XaaS Orchestration Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
