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

    const { message, conversationHistory } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    // Build conversation context
    const messages = [
      {
        role: 'system',
        content: `You are an intelligent AI copilot for a content creation platform. You understand natural language and can help users create and manage their creative content.

**Your Capabilities:**
- Understand casual, conversational requests and extract the necessary information
- Create characters with rich details (name, role, personality, background, goals)
- Create episodes with engaging content (title, season, episode number, synopsis, content)
- Create projects that organize creative work (title, description, genre, theme, mood)
- Answer questions, provide suggestions, and offer creative guidance
- Infer missing details intelligently based on context

**Understanding Natural Language:**
- When users describe a character casually (e.g., "make a brave knight"), infer reasonable defaults for all fields
- Extract structured data from conversational text
- Ask for clarification only when truly ambiguous
- Be proactive in suggesting creative enhancements

**Response Format:**
Always respond with a JSON object:

For creating content:
{
  "action": "create_character" | "create_episode" | "create_project",
  "data": {
    // Fill in ALL required fields, inferring intelligent defaults from the user's description
    // For characters: name, role, personality, background, goals
    // For episodes: title, season, episode_number, synopsis, content, project_id (if mentioned)
    // For projects: title, description, genre, theme, mood
  },
  "message": "Friendly confirmation with what you created"
}

For conversations:
{
  "action": "chat",
  "message": "Helpful, conversational response with suggestions or information"
}

**Examples of Natural Language Understanding:**
- "create a villain" → Infer: evil character with dark goals and sinister personality
- "add episode 5 about the heist" → Infer: season 1, episode 5, create heist-themed content
- "make a sci-fi project" → Infer: futuristic theme, science fiction genre, appropriate mood

Always be creative, helpful, and conversational while maintaining the JSON structure for actions.`
      },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error('AI service error');
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices[0].message.content;

    // Try to parse as JSON for actions
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(assistantMessage);
    } catch {
      // If not JSON, treat as chat message
      parsedResponse = {
        action: 'chat',
        message: assistantMessage
      };
    }

    // Execute actions if needed
    let executionResult = null;
    if (parsedResponse.action === 'create_character' && parsedResponse.data) {
      const { error } = await supabase
        .from('characters')
        .insert({
          user_id: user.id,
          project_id: parsedResponse.data.project_id,
          ...parsedResponse.data
        });
      
      if (error) executionResult = { error: error.message };
      else executionResult = { success: true };
    } else if (parsedResponse.action === 'create_episode' && parsedResponse.data) {
      const { error } = await supabase
        .from('episodes')
        .insert({
          user_id: user.id,
          project_id: parsedResponse.data.project_id,
          ...parsedResponse.data
        });
      
      if (error) executionResult = { error: error.message };
      else executionResult = { success: true };
    } else if (parsedResponse.action === 'create_project' && parsedResponse.data) {
      const { error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          ...parsedResponse.data
        });
      
      if (error) executionResult = { error: error.message };
      else executionResult = { success: true };
    }

    return new Response(
      JSON.stringify({
        response: parsedResponse,
        executionResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('AI copilot error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
