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

    const { keepEpisodeId } = await req.json();

    console.log('🗑️ Cleaning up old episodes...');
    console.log(`📌 Keeping episode: ${keepEpisodeId}`);

    // Delete all episodes except the one we want to keep
    const { data: deletedEpisodes, error: deleteError } = await supabase
      .from('episodes')
      .delete()
      .neq('id', keepEpisodeId)
      .select('id, episode_number, title');

    if (deleteError) {
      console.error('Delete error:', deleteError);
      throw deleteError;
    }

    console.log(`✅ Deleted ${deletedEpisodes?.length || 0} episodes`);
    deletedEpisodes?.forEach(ep => {
      console.log(`  - Episode ${ep.episode_number}: ${ep.title}`);
    });

    return new Response(
      JSON.stringify({
        success: true,
        deletedCount: deletedEpisodes?.length || 0,
        deletedEpisodes,
        message: `Deleted ${deletedEpisodes?.length || 0} old episodes, kept ${keepEpisodeId}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Cleanup error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
