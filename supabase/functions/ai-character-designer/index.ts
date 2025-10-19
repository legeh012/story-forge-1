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

    const systemPrompt = `You are an expert cinematic character designer and NLP parser. Extract and generate complete character profiles from natural language prompts.

PARSING RULES:
- Extract name, role, personality traits, drama hooks, and appearance details
- Infer emotional depth and conflict potential
- Generate visual styling (clothing, makeup, aesthetic)
- Identify relationship dynamics and feuds
- Fill missing details with genre-appropriate defaults

CHARACTER ARCHETYPES:
- Boutique Queen: Strategic, fashionable, drama catalyst
- Confessional Narrator: Stylish observer, detached commentary
- Protective Parent: Emotional, loyal, defensive
- Shady Newcomer: Mysterious, provocative
- Peacemaker: Diplomatic, stressed, caught in middle

APPEARANCE GENERATION:
Create detailed JSON with: clothing_style, makeup_style, hair_style, signature_accessories, color_palette, aesthetic_vibe

DRAMA HOOKS:
Identify conflict triggers: leaks secrets, feuds, gossip, emotional breakdowns, confrontations

Make every character VISUALLY DISTINCT and emotionally COMPELLING. Think reality TV meets Netflix drama.`;

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
                role: { type: "string", description: "Character archetype/role (Boutique Queen, Protective Mom, etc.)" },
                age: { type: "number", description: "Character's age" },
                personality: { type: "string", description: "Core personality traits (strategic, emotional, detached, etc.)" },
                background: { type: "string", description: "Rich backstory explaining who they are and what shaped them" },
                goals: { type: "string", description: "Motivations, desires, and what drives their actions" },
                drama_hooks: { 
                  type: "array",
                  items: { type: "string" },
                  description: "Conflict triggers: 'leaks screenshots', 'feuds with X', 'gossip catalyst', 'emotional breakdowns'"
                },
                appearance: {
                  type: "object",
                  properties: {
                    clothing_style: { type: "string", description: "Signature outfit style (gold abayas, earth tones, designer modest wear)" },
                    makeup_style: { type: "string", description: "Makeup aesthetic (matte glam, natural, bold)" },
                    hair_style: { type: "string", description: "Hair/hijab style (side-parted hijab, sleek bun, loose waves)" },
                    signature_accessories: { type: "string", description: "Key accessories (statement jewelry, designer bags)" },
                    color_palette: { type: "string", description: "Dominant colors they wear" },
                    aesthetic_vibe: { type: "string", description: "Overall visual vibe (luxe, understated, bold)" }
                  }
                },
                emotional_tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Emotional states for scene generation: 'composed', 'defensive', 'tearful', 'confrontational'"
                },
                relationships: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      character: { type: "string", description: "Name of related character" },
                      type: { type: "string", description: "Relationship type: ally, rival, feud, family" },
                      description: { type: "string", description: "Dynamic description" }
                    }
                  }
                }
              },
              required: ["name", "role", "personality", "background", "goals", "appearance", "drama_hooks", "emotional_tags"],
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

    // Auto-fill missing fields with defaults
    const metadata: any = { 
      generated_from_prompt: prompt,
      drama_hooks: characterData.drama_hooks || [],
      emotional_tags: characterData.emotional_tags || ['neutral'],
      appearance: characterData.appearance || {}
    };

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
        metadata
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
