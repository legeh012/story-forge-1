import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, userId, data } = await req.json();
    console.log('Botpress action received:', { action, userId, data });

    let result;
    
    switch (action) {
      case 'generate_episode':
        // Call generate-episode-from-prompt function
        const { data: episodeData, error: episodeError } = await supabase.functions.invoke(
          'generate-episode-from-prompt',
          {
            body: {
              projectId: data.projectId,
              prompt: data.prompt,
            }
          }
        );
        
        if (episodeError) throw episodeError;
        result = { success: true, episode: episodeData };
        break;

      case 'download_episode':
        // Fetch episode data
        const { data: episode, error: fetchError } = await supabase
          .from('episodes')
          .select('*')
          .eq('id', data.episodeId)
          .single();
        
        if (fetchError) throw fetchError;
        result = { success: true, downloadUrl: episode.video_url };
        break;

      case 'list_episodes':
        // List user's episodes
        const { data: episodes, error: listError } = await supabase
          .from('episodes')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (listError) throw listError;
        result = { success: true, episodes };
        break;

      case 'get_project':
        // Get or create project
        let { data: project, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (projectError && projectError.code === 'PGRST116') {
          // Create new project if none exists
          const { data: newProject, error: createError } = await supabase
            .from('projects')
            .insert([{
              user_id: userId,
              name: 'Botpress Project',
              description: 'Project created via Botpress bot'
            }])
            .select()
            .single();
          
          if (createError) throw createError;
          project = newProject;
        } else if (projectError) {
          throw projectError;
        }
        
        result = { success: true, project };
        break;

      default:
        result = { success: false, error: 'Unknown action' };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in botpress-webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
