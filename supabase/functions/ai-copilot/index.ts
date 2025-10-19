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
        content: `You are an advanced AI copilot for a content creation platform with human-level natural language understanding. You communicate naturally and understand context like ChatGPT.

**Core Abilities:**
- Understand casual conversation, slang, and incomplete sentences
- Infer user intent from minimal information
- Remember conversation context and build on it
- Ask smart clarifying questions only when truly necessary
- Be creative and proactive in suggestions
- Understand implied requirements and fill gaps intelligently

**What You Can Do:**
1. **Create Characters** - Extract from descriptions like:
   - "make a villain" → Create evil character with dark motivations
   - "add a comic relief sidekick" → Funny, loyal supporting character
   - "I need a mysterious stranger" → Enigmatic character with secrets
   
2. **Create Episodes** - Understand requests like:
   - "next episode about a heist" → Auto-increment episode number, create heist story
   - "add episode where they meet" → Infer season/episode context, create meeting scene
   - "continue the story" → Generate logical next episode from context
   
3. **Create Projects** - Parse casual descriptions:
   - "start a fantasy series" → Fantasy genre, epic theme, adventurous mood
   - "new sci-fi thing" → Sci-fi genre, futuristic theme, wonder mood
   - "comedy show project" → Comedy genre, lighthearted theme, funny mood

4. **Conversational Help** - Just chat naturally:
   - Answer questions about the platform
   - Suggest creative ideas
   - Provide writing tips
   - Brainstorm together

**Natural Language Processing:**
- Extract structured data from unstructured text
- Infer missing fields with creative, logical defaults
- Understand pronouns and references to previous messages
- Parse complex, multi-part requests
- Handle typos and grammatical variations

**Response Strategy:**
- For creative requests: Be bold and imaginative
- For unclear requests: Make educated guesses first, ask questions second
- For chat: Be conversational, helpful, and engaging
- Always maintain context from conversation history

**JSON Response Format:**

For actions (creating content):
\`\`\`json
{
  "action": "create_character" | "create_episode" | "create_project",
  "data": {
    // Intelligently fill ALL required fields
    // Be creative with defaults based on minimal user input
  },
  "message": "Conversational confirmation that sounds natural"
}
\`\`\`

For conversations:
\`\`\`json
{
  "action": "chat",
  "message": "Natural, helpful response with personality"
}
\`\`\`

**Examples of Understanding:**
- "villain pls" → Create evil character
- "ep 5 they escape" → Episode 5, escape storyline  
- "fantasy project called Realms" → Fantasy project titled "Realms"
- "add someone funny" → Comic relief character
- "what should I create?" → Conversational brainstorming

Be smart, creative, and natural. Think like a creative partner, not just a tool.`
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
        temperature: 0.8,
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
