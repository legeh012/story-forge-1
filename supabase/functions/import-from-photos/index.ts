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
    const { projectId } = await req.json();

    if (!projectId) {
      return new Response(JSON.stringify({ error: 'Project ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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

    console.log(`🖼️ Importing characters from photos for project ${projectId}`);

    // Get uploaded images for this project
    const { data: attachments, error: fetchError } = await supabase
      .from('generation_attachments')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .ilike('file_type', 'image%')
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;
    if (!attachments || attachments.length === 0) {
      return new Response(JSON.stringify({ error: 'No images found for this project' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${attachments.length} images to analyze`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const importedCharacters = [];

    // Process each image with AI vision
    for (const attachment of attachments) {
      try {
        // Get public URL for the image
        const { data: urlData } = supabase.storage
          .from('generation-attachments')
          .getPublicUrl(attachment.file_path);

        const imageUrl = urlData.publicUrl;
        console.log(`Analyzing image: ${attachment.file_name}`);

        // Use Lovable AI with vision model to analyze the image
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
                content: 'You are a character designer AI. Analyze images of people and create detailed character profiles. Return ONLY valid JSON with this exact structure: {"name": "string", "role": "string", "personality": "string", "background": "string", "goals": "string", "appearance": {"clothing_style": "string", "makeup_style": "string", "hair_style": "string", "aesthetic_vibe": "string", "color_palette": "string"}, "traits": ["trait1", "trait2", "trait3"]}'
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Analyze this person and create a reality TV character profile. Focus on their appearance, style, and potential personality. Be creative and dramatic - think Real Housewives energy. Return ONLY the JSON object, no other text.'
                  },
                  {
                    type: 'image_url',
                    image_url: { url: imageUrl }
                  }
                ]
              }
            ],
            temperature: 0.7,
            max_tokens: 1000
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error(`AI error for ${attachment.file_name}:`, errorText);
          continue;
        }

        const aiData = await aiResponse.json();
        const characterData = aiData.choices?.[0]?.message?.content;
        
        if (!characterData) {
          console.error(`No character data from AI for ${attachment.file_name}`);
          continue;
        }

        // Parse the JSON response
        let parsedCharacter;
        try {
          // Remove markdown code blocks if present
          const cleanedData = characterData.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          parsedCharacter = JSON.parse(cleanedData);
        } catch (parseError) {
          console.error(`Failed to parse character data for ${attachment.file_name}:`, parseError);
          continue;
        }

        // Create character in database
        const { data: insertedChar, error: insertError } = await supabase
          .from('characters')
          .insert({
            user_id: user.id,
            project_id: projectId,
            name: parsedCharacter.name,
            role: parsedCharacter.role,
            personality: parsedCharacter.personality,
            background: parsedCharacter.background,
            goals: parsedCharacter.goals,
            relationships: [],
            metadata: {
              appearance: parsedCharacter.appearance || {},
              emotional_tags: parsedCharacter.traits || [],
              source_image: imageUrl,
              imported_from_photo: true
            }
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Error creating character from ${attachment.file_name}:`, insertError);
          continue;
        }

        importedCharacters.push(insertedChar);
        console.log(`✅ Created character: ${parsedCharacter.name}`);

      } catch (imageError) {
        console.error(`Error processing image ${attachment.file_name}:`, imageError);
        continue;
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      imported: importedCharacters.length,
      total_images: attachments.length,
      characters: importedCharacters
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Import from photos error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
