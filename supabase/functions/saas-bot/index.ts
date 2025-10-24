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

    const { operation, data: requestData } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    console.log('💼 SaaS Bot: Processing application-level service request...');

    const startTime = Date.now();

    // SaaS operations: user management, content delivery, app features
    const saasPrompt = `You are a SaaS (Software as a Service) AI bot managing application-level services.

Operation: ${operation}
Data: ${JSON.stringify(requestData)}

Your responsibilities:
- Video generation and management
- User account services
- Content delivery optimization
- Feature enablement/configuration
- Application analytics

Provide a detailed action plan in JSON format:
{
  "actions": ["action1", "action2"],
  "user_impact": "description",
  "resources_needed": ["resource1"],
  "success_metrics": {"metric": "value"}
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: saasPrompt }],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('SaaS AI processing failed');
    }

    const aiData = await aiResponse.json();
    const actionPlan = JSON.parse(
      aiData.choices[0].message.content.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    );

    const executionTime = Date.now() - startTime;

    // Log service operation
    await supabase.from('service_operations').insert({
      service_id: null, // Would reference actual service
      operation_type: operation,
      status: 'completed',
      input_data: requestData,
      output_data: actionPlan,
      execution_time_ms: executionTime,
      user_id: user.id,
      completed_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({
      success: true,
      service: 'SaaS',
      action_plan: actionPlan,
      execution_time_ms: executionTime,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('SaaS Bot Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
