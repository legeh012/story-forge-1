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
    const { characters, projectId } = await req.json();

    if (!characters || !Array.isArray(characters)) {
      return new Response(JSON.stringify({ error: 'Characters array is required' }), {
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

    console.log(`Importing ${characters.length} characters for user ${user.id}`);

    const importedCharacters = [];
    
    for (const char of characters) {
      // Build personality description from traits
      const personality = char.traits?.join(', ') || '';
      
      // Build background from drama hooks and appearance
      const background = `${char.drama_hooks || 'No background provided.'}`;
      
      // Extract relationships for the relationships field
      const relationships: Array<{character: string; type: string; description: string}> = [];
      if (char.relationships?.rivalries) {
        char.relationships.rivalries.forEach((rival: string) => {
          relationships.push({
            character: rival,
            type: 'rivalry',
            description: 'Ongoing feud'
          });
        });
      }
      if (char.relationships?.alliances) {
        char.relationships.alliances.forEach((ally: string) => {
          relationships.push({
            character: ally,
            type: 'alliance',
            description: 'Supportive relationship'
          });
        });
      }
      if (char.relationships?.romantic) {
        char.relationships.romantic.forEach((partner: string) => {
          relationships.push({
            character: partner,
            type: 'romantic',
            description: 'Romantic connection'
          });
        });
      }

      // Build metadata with all custom fields
      const metadata = {
        appearance: char.appearance || {},
        drama_hooks: char.drama_hooks ? [char.drama_hooks] : [],
        emotional_tags: char.traits || [],
        status: char.status || 'active',
        imported_template: true,
        original_role: char.role
      };

      const { data: insertedChar, error: insertError } = await supabase
        .from('characters')
        .insert({
          user_id: user.id,
          project_id: projectId,
          name: char.name,
          role: char.role,
          age: null, // Template doesn't have age
          personality,
          background,
          goals: char.drama_hooks || '',
          relationships,
          metadata
        })
        .select()
        .single();

      if (insertError) {
        console.error(`Error importing character ${char.name}:`, insertError);
        continue;
      }

      importedCharacters.push(insertedChar);
      console.log(`Imported character: ${char.name}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      imported: importedCharacters.length,
      characters: importedCharacters
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in import-characters:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
