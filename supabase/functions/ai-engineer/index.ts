import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EngineerRequest {
  message: string;
  action?: 'diagnose' | 'fix' | 'orchestrate' | 'generate_project';
  context?: {
    errorLogs?: any[];
    systemHealth?: any[];
    currentPage?: string;
  };
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

    const { message, action = 'diagnose', context } = await req.json() as EngineerRequest;

    console.log('AI Engineer request:', { message, action, userId: user.id });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    // Gather system context
    const { data: errorLogs } = await supabase
      .from('error_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: systemHealth } = await supabase
      .from('system_health')
      .select('*')
      .order('last_check', { ascending: false })
      .limit(5);

    const { data: botStats } = await supabase
      .from('bot_execution_stats')
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(20);

    // Build comprehensive system prompt based on action
    let systemPrompt = '';
    switch (action) {
      case 'diagnose':
        systemPrompt = `You are an expert AI computer engineer specializing in system diagnostics. 
Analyze the user's issue and provide detailed diagnostic information including:
- Root cause analysis
- Affected components
- Potential solutions
- Priority level (low/medium/high/critical)

Recent error logs: ${JSON.stringify(errorLogs || [])}
System health: ${JSON.stringify(systemHealth || [])}
Bot execution stats: ${JSON.stringify(botStats || [])}

Provide a clear, actionable diagnosis.`;
        break;

      case 'fix':
        systemPrompt = `You are an expert AI computer engineer with system repair capabilities.
Based on the issue described, provide:
1. Step-by-step fix instructions
2. Code changes needed (if applicable)
3. Recovery actions to take
4. Preventive measures

Recent errors: ${JSON.stringify(errorLogs || [])}

Provide clear, executable solutions.`;
        break;

      case 'orchestrate':
        systemPrompt = `You are an AI orchestrator managing multiple specialized bots:
- Trend Detection Bot
- Script Generator Bot
- Hook Optimization Bot
- Remix Bot
- Cross-Platform Poster
- Performance Tracker
- Expert Director
- Production Team
- Scene Orchestration

Analyze the user's request and determine:
1. Which bots should be activated
2. In what sequence
3. With what parameters
4. Expected outcomes

Provide a detailed orchestration plan in JSON format.`;
        break;

      case 'generate_project':
        systemPrompt = `You are an AI project architect. Generate a complete project plan including:
1. Project structure and components
2. Database schema requirements
3. Required bots and their configurations
4. Implementation roadmap
5. Success metrics

Provide a comprehensive project blueprint in JSON format.`;
        break;
    }

    // Add user context
    if (context) {
      systemPrompt += `\n\nUser Context: ${JSON.stringify(context)}`;
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error('AI gateway error');
    }

    const aiData = await aiResponse.json();
    const response = aiData.choices[0].message.content;

    // Log the interaction
    await supabase.from('bot_activities').insert({
      user_id: user.id,
      bot_id: null,
      status: 'completed',
      results: {
        action,
        response,
        context
      }
    });

    // If this was a fix action, create a recovery record
    if (action === 'fix') {
      await supabase.from('error_logs').insert({
        error_type: 'UserReported',
        error_message: message,
        recovery_action: 'ai_engineer_fix',
        recovery_status: 'resolved',
        user_id: user.id,
        context: { ai_response: response },
        resolved_at: new Date().toISOString()
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        action,
        response,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('AI Engineer error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
