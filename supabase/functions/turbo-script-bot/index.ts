import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectContext, episodeNumber } = await req.json();
    
    console.log(`⚡ TURBO Script Bot activated for Episode ${episodeNumber}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const characterNames = projectContext.characters?.map((c: any) => c.name).join(', ') || 'the characters';
    
    const scriptPrompt = `Create a compelling script for Episode ${episodeNumber}.

Project Context:
${JSON.stringify(projectContext, null, 2)}

CRITICAL REQUIREMENT - CHARACTER USAGE:
You MUST use ONLY these exact character names in the script: ${characterNames}
DO NOT create new character names. DO NOT use any characters not in this list.
${projectContext.characters?.map((c: any) => `- ${c.name}: ${c.role || 'role'}`).join('\n') || ''}

Generate:
1. Episode title (catchy and engaging)
2. Synopsis (2-3 sentences)
3. Detailed 3-scene storyboard with:
   - Visual description for each scene (using ONLY the characters listed above)
   - Character dialogue (using ONLY the characters listed above)
   - Scene transitions

Make it dramatic, engaging, and optimized for viral potential. Keep scenes visually rich and emotionally compelling.
Use the actual characters from the project - their names, roles, and personalities MUST match the list above EXACTLY.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: scriptPrompt
        }],
        tools: [{
          type: "function",
          function: {
            name: "create_episode_script",
            description: "Generate structured episode script",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                synopsis: { type: "string" },
                storyboard: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      sceneNumber: { type: "number" },
                      description: { type: "string" },
                      dialogue: { type: "string" },
                      duration: { type: "number" }
                    },
                    required: ["sceneNumber", "description", "dialogue"]
                  }
                }
              },
              required: ["title", "synopsis", "storyboard"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "create_episode_script" } }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI request failed: ${errorText}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const script = JSON.parse(toolCall.function.arguments);
    
    console.log(`✅ TURBO Script generated: "${script.title}"`);

    return new Response(
      JSON.stringify({
        success: true,
        script,
        botType: 'turbo-script-bot'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Turbo Script Bot error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
