import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, projectId } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generating character from prompt:', prompt);

    const systemPrompt = `You are an expert cinematic character designer. Generate a complete, production-ready character based on the user's prompt.

Return a structured character with:
- name: A compelling, memorable character name
- role: Their role in the story (protagonist, antagonist, mentor, etc.)
- age: Appropriate age for their role
- personality: 3-5 distinct personality traits that create depth
- background: A rich backstory (2-3 paragraphs) that explains who they are
- goals: Clear motivations and objectives that drive their actions
- relationships: Array of potential relationships with other characters

Make characters feel REAL and CINEMATIC. Think Netflix-quality production. Be specific, visual, and emotionally resonant.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_character",
            description: "Create a cinematic character with complete details",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string", description: "Character's full name" },
                role: { type: "string", description: "Character's role in the story" },
                age: { type: "number", description: "Character's age" },
                personality: { type: "string", description: "Personality traits and characteristics" },
                background: { type: "string", description: "Detailed background story" },
                goals: { type: "string", description: "Motivations and objectives" },
                relationships: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      character: { type: "string" },
                      type: { type: "string" },
                      description: { type: "string" }
                    }
                  }
                }
              },
              required: ["name", "role", "personality", "background", "goals"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "create_character" } }
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('Failed to generate character');
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0].message.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No character data generated');
    }

    const characterData = JSON.parse(toolCall.function.arguments);
    console.log('Generated character:', characterData);

    const { data: character, error: insertError } = await supabase
      .from('characters')
      .insert({
        user_id: user.id,
        project_id: projectId,
        name: characterData.name,
        role: characterData.role,
        age: characterData.age || null,
        personality: characterData.personality,
        background: characterData.background,
        goals: characterData.goals,
        relationships: characterData.relationships || [],
        metadata: { generated_from_prompt: prompt }
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    console.log('Character created successfully:', character.id);

    return new Response(JSON.stringify({ 
      success: true, 
      character 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-character-designer:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
