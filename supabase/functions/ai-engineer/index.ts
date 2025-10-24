import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EngineerRequest {
  message: string;
  action?: 'diagnose' | 'fix' | 'orchestrate' | 'generate_project' | 'code_review';
  context?: {
    errorLogs?: any[];
    systemHealth?: any[];
    currentPage?: string;
    userAgent?: string;
    timestamp?: string;
    screenSize?: { width: number; height: number };
  };
  conversationHistory?: Array<{ role: string; content: string }>;
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

    const { message, action = 'diagnose', context, conversationHistory = [] } = await req.json() as EngineerRequest;

    console.log('AI Code Space request:', { message, action, userId: user.id, historyLength: conversationHistory.length });

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
    const baseContext = `
System Context:
- Recent Errors: ${errorLogs?.length || 0} logged
- System Health: ${systemHealth?.[0]?.status || 'unknown'}
- Bot Executions: ${botStats?.length || 0} recent activities
- User Context: ${JSON.stringify(context || {})}
`;

    switch (action) {
      case 'diagnose':
        systemPrompt = `You are an elite AI code space assistant combining the best of ChatGPT, GitHub Copilot, and Claude. 
You have deep understanding of the entire application architecture and can diagnose issues with precision.

Your capabilities:
- Deep code analysis and pattern recognition
- Root cause identification with high accuracy
- Understanding of system-wide dependencies
- Context-aware problem solving

${baseContext}

Recent Error Details: ${JSON.stringify(errorLogs || [], null, 2)}
System Health Metrics: ${JSON.stringify(systemHealth || [], null, 2)}

Provide a thorough diagnostic analysis with:
1. Root cause identification
2. Impact assessment
3. Affected components and dependencies
4. Recommended solutions (prioritized)
5. Prevention strategies

Be conversational but precise. Think step-by-step.`;
        break;

      case 'fix':
        systemPrompt = `You are an expert AI debugging assistant with the combined intelligence of ChatGPT, GitHub Copilot, and Claude.
You understand code deeply and can provide precise, actionable fixes.

${baseContext}

Error Context: ${JSON.stringify(errorLogs || [], null, 2)}

Provide comprehensive fix guidance:
1. Immediate resolution steps (what to do right now)
2. Code changes with explanations (show before/after)
3. Testing approach to verify the fix
4. Long-term improvements to prevent recurrence
5. Related areas that might need attention

Use clear language and provide specific code examples when relevant.`;
        break;

      case 'code_review':
        systemPrompt = `You are a senior code reviewer with expertise spanning multiple paradigms and best practices.
You combine the analytical power of static analysis tools with the contextual understanding of human reviewers.

${baseContext}

Review Focus Areas:
- Code quality and maintainability
- Performance optimization opportunities
- Security vulnerabilities
- Best practices adherence
- Potential bugs or edge cases
- Architecture and design patterns

Provide a thorough code review covering:
1. Overall assessment
2. Specific issues found (with severity)
3. Improvement suggestions with code examples
4. Positive highlights (what's done well)
5. Actionable next steps

Be constructive and educational in your feedback.`;
        break;

      case 'orchestrate':
        systemPrompt = `You are an intelligent orchestration AI managing a complex bot ecosystem.
Your role is to coordinate multiple specialized agents to achieve optimal outcomes.

Available Specialized Bots:
- Trend Detection Bot (analyzes viral patterns)
- Script Generator Bot (creates engaging content)
- Hook Optimization Bot (improves content hooks)
- Remix Bot (transforms existing content)
- Cross-Platform Poster (distributes content)
- Performance Tracker (monitors metrics)
- Expert Director (guides creative decisions)
- Production Team (manages workflows)
- Scene Orchestration (coordinates scene generation)

${baseContext}

Bot Activity History: ${JSON.stringify(botStats || [], null, 2)}

Analyze the request and create an orchestration plan:
1. Selected bots and their roles
2. Execution sequence with dependencies
3. Parameter configuration for each bot
4. Expected outcomes and success metrics
5. Fallback strategies if issues occur

Present as a clear, executable plan.`;
        break;

      case 'generate_project':
        systemPrompt = `You are an AI project architect with comprehensive understanding of modern application development.
You can design complete, production-ready project structures from natural language descriptions.

${baseContext}

Create a detailed project blueprint including:
1. Project Overview
   - Core objectives and features
   - Target audience and use cases
   - Technical requirements

2. Architecture Design
   - Component structure
   - Data flow patterns
   - Integration points

3. Database Schema
   - Tables and relationships
   - Indexes and constraints
   - Data types and validations

4. Bot Configuration
   - Required specialized bots
   - Their roles and triggers
   - Interaction patterns

5. Implementation Roadmap
   - Phase breakdown
   - Priority ordering
   - Time estimates
   - Success criteria

6. Technical Stack Recommendations
   - Frontend technologies
   - Backend services
   - Third-party integrations

Be thorough and production-focused. Provide JSON structure where appropriate.`;
        break;

      default:
        systemPrompt = `You are an advanced AI assistant combining ChatGPT's conversational ability, 
GitHub Copilot's code understanding, and Claude's analytical depth.

${baseContext}

Help the user with their request by:
- Understanding context deeply
- Providing clear, actionable guidance
- Explaining complex concepts simply
- Offering multiple solutions when appropriate
- Being proactive about potential issues

Respond naturally and helpfully.`;
    }

    // Add user context
    if (context) {
      systemPrompt += `\n\nUser Context: ${JSON.stringify(context)}`;
    }

    // Build messages array with conversation history
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...conversationHistory.slice(-8).map(msg => ({ // Keep last 8 messages for context
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro', // Using Pro for better reasoning
        messages,
        temperature: 0.8,
        max_tokens: 2048,
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
