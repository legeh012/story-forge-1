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
    const { projectContext, episodeNumber, duration, customPrompt, culturalContext } = await req.json();
    
    console.log(`⚡ TURBO Script Bot with Cultural Intelligence activated for Episode ${episodeNumber}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const characterNames = projectContext.characters?.map((c: any) => c.name).join(', ') || 'the characters';
    
    // Build cultural awareness prompt
    const culturalPrompt = culturalContext ? `
CULTURAL INTELLIGENCE & AUTHENTICITY:
Cultural Background: ${culturalContext.background || 'Contemporary multicultural setting'}
Cultural Elements to Include:
- Language patterns: ${culturalContext.languagePatterns || 'Natural dialogue with cultural authenticity'}
- References: ${culturalContext.references || 'Contemporary cultural touchpoints'}
- Humor style: ${culturalContext.humorStyle || 'Relatable, culturally grounded'}
- Values/themes: ${culturalContext.values || 'Universal themes with cultural specificity'}
- Trending topics: ${culturalContext.trendingTopics || 'Current viral moments and memes'}

CRITICAL: Make cultural elements feel NATURAL and AUTHENTIC, not forced or stereotypical.
Inject viral potential through culturally relevant humor, controversy, and trending references.
` : `
CULTURAL INTELLIGENCE:
- Make content culturally relevant and shareable
- Include trending memes and viral references naturally
- Add humor that resonates across cultures
- Reference current events and viral moments
- Create moments designed for social media clips
`;

    const scriptPrompt = customPrompt ? `${customPrompt}

${culturalPrompt}

Using these characters ONLY: ${characterNames}
${projectContext.characters?.map((c: any) => `- ${c.name}: ${c.role || 'role'}`).join('\n') || ''}

Create a ${duration || 180}-second video script with cultural authenticity and viral potential.
` : `Create a compelling script for Episode ${episodeNumber}.

Project Context:
${JSON.stringify(projectContext, null, 2)}

${culturalPrompt}

CRITICAL REQUIREMENT - CHARACTER USAGE:
You MUST use ONLY these exact character names in the script: ${characterNames}
DO NOT create new character names. DO NOT use any characters not in this list.
${projectContext.characters?.map((c: any) => `- ${c.name}: ${c.role || 'role'}`).join('\n') || ''}

Generate:
1. Episode title (catchy, viral-worthy, culturally resonant)
2. Synopsis (2-3 sentences with cultural hooks)
3. Detailed ${duration ? Math.ceil(duration / 60) : 3}-scene storyboard with:
   - Visual description for each scene (using ONLY the characters listed above)
   - Culturally authentic dialogue (using ONLY the characters listed above)
   - Viral moments (designed for social media sharing)
   - Scene transitions with cultural flair

Make it dramatic, engaging, culturally authentic, and optimized for viral potential.
Inject trending cultural references, relatable humor, and shareable moments naturally.
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
                      description: { type: "string", description: "Photorealistic visual description" },
                      dialogue: { type: "string", description: "Culturally authentic dialogue" },
                      duration: { type: "number", description: "Scene duration in seconds" },
                      culturalMoment: { type: "string", description: "Viral-worthy cultural reference or moment" },
                      viralPotential: { type: "string", description: "Why this scene could go viral" }
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
    
    console.log(`✅ TURBO Script with Cultural Intelligence generated: "${script.title}"`);
    console.log(`📊 Cultural moments: ${script.storyboard?.filter((s: any) => s.culturalMoment).length || 0}`);
    console.log(`🔥 Viral potential scenes: ${script.storyboard?.filter((s: any) => s.viralPotential).length || 0}`);

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
