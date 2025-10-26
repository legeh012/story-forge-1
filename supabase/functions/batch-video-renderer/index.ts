import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BatchRenderRequest {
  episode_manifests: string[];
  settings: {
    frame_rate: number;
    resolution: string;
    audio_file: string;
    transitions: string[];
    output_format: string;
    audio_instructions: string;
  };
  output_paths: string[];
}

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

    const { episode_manifests, settings, output_paths }: BatchRenderRequest = await req.json();

    console.log('🎬 BATCH VIDEO RENDERER ACTIVATED');
    console.log(`📊 Total Episodes: ${episode_manifests.length}`);
    console.log(`📹 Settings:`, JSON.stringify(settings, null, 2));
    console.log(`🎵 Audio: ${settings.audio_file}`);
    console.log(`⚡ Resolution: ${settings.resolution} @ ${settings.frame_rate}fps`);

    // Fetch all episodes from database
    const { data: episodes, error: episodesError } = await supabase
      .from('episodes')
      .select('*')
      .eq('user_id', user.id)
      .order('episode_number', { ascending: true });

    if (episodesError || !episodes) {
      throw new Error('Failed to fetch episodes');
    }

    console.log(`✅ Found ${episodes.length} episodes in database`);

    const batchStartTime = Date.now();
    const results: Array<{
      episodeId: string;
      episodeNumber: number;
      title: string;
      status: string;
      videoUrl?: string;
      error?: string;
      processingTime?: number;
    }> = [];

    // Process episodes in batches of 3 to avoid overwhelming the system
    const BATCH_SIZE = 3;
    let processedCount = 0;

    for (let i = 0; i < episodes.length; i += BATCH_SIZE) {
      const batch = episodes.slice(i, i + BATCH_SIZE);
      console.log(`\n🎥 Processing Batch ${Math.floor(i / BATCH_SIZE) + 1} (Episodes ${i + 1}-${Math.min(i + BATCH_SIZE, episodes.length)})`);

      // Process batch in parallel
      const batchPromises = batch.map(async (episode) => {
        const episodeStartTime = Date.now();
        
        try {
          console.log(`\n🎬 Rendering Episode ${episode.episode_number}: "${episode.title}"`);
          
          // Update episode status
          await supabase
            .from('episodes')
            .update({
              video_status: 'rendering',
              updated_at: new Date().toISOString()
            })
            .eq('id', episode.id);

          // Invoke FFmpeg video engine
          const { data: videoResult, error: videoError } = await supabase.functions.invoke('ffmpeg-video-engine', {
            body: {
              episode: episode.id,
              userId: user.id,
              settings: {
                frame_rate: settings.frame_rate,
                resolution: settings.resolution,
                audio_file: settings.audio_file,
                transitions: settings.transitions,
                captions_file: null,
                output_format: settings.output_format,
                audio_instructions: settings.audio_instructions
              },
              remixConfig: {
                cast: [],
                music: settings.audio_file,
                overlay: 'premium',
                remixable: false,
                metadata: {
                  quality: 'ultra',
                  style: 'vh1-netflix-premium',
                  frames: episode.storyboard || [],
                  audioUrl: settings.audio_file
                }
              }
            }
          });

          if (videoError) {
            throw new Error(videoError.message);
          }

          const processingTime = Date.now() - episodeStartTime;
          
          console.log(`✅ Episode ${episode.episode_number} completed in ${(processingTime / 1000).toFixed(2)}s`);
          
          processedCount++;
          
          return {
            episodeId: episode.id,
            episodeNumber: episode.episode_number,
            title: episode.title,
            status: 'completed',
            videoUrl: videoResult?.videoUrl,
            processingTime
          };

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`❌ Episode ${episode.episode_number} failed:`, errorMessage);
          
          // Update episode status to failed
          await supabase
            .from('episodes')
            .update({
              video_status: 'failed',
              video_error: errorMessage,
              updated_at: new Date().toISOString()
            })
            .eq('id', episode.id);

          return {
            episodeId: episode.id,
            episodeNumber: episode.episode_number,
            title: episode.title,
            status: 'failed',
            error: errorMessage,
            processingTime: Date.now() - episodeStartTime
          };
        }
      });

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      console.log(`✅ Batch complete: ${batchResults.filter(r => r.status === 'completed').length}/${batchResults.length} successful`);
    }

    const totalTime = Date.now() - batchStartTime;
    const successCount = results.filter(r => r.status === 'completed').length;
    const failCount = results.filter(r => r.status === 'failed').length;

    console.log('\n🎉 BATCH RENDERING COMPLETE');
    console.log(`⏱️  Total Time: ${(totalTime / 1000 / 60).toFixed(2)} minutes`);
    console.log(`✅ Successful: ${successCount}/${results.length}`);
    console.log(`❌ Failed: ${failCount}/${results.length}`);
    console.log(`📊 Success Rate: ${((successCount / results.length) * 100).toFixed(1)}%`);

    return new Response(
      JSON.stringify({
        success: true,
        totalEpisodes: results.length,
        successCount,
        failCount,
        totalProcessingTime: `${(totalTime / 1000 / 60).toFixed(2)} minutes`,
        results: results.map(r => ({
          episodeNumber: r.episodeNumber,
          title: r.title,
          status: r.status,
          videoUrl: r.videoUrl,
          error: r.error,
          processingTime: r.processingTime ? `${(r.processingTime / 1000).toFixed(2)}s` : null
        })),
        settings,
        message: `🎬 Batch rendering complete: ${successCount}/${results.length} episodes rendered successfully`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Batch video renderer error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
