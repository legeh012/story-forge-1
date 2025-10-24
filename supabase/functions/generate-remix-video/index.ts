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

    const { episode, cast, music, overlay, remixable } = await req.json();

    console.log('Generating remix video:', { episode, cast, music, overlay, remixable });

    // Invoke FFmpeg video engine with remix parameters
    const { data: videoData, error: videoError } = await supabase.functions.invoke('ffmpeg-video-engine', {
      body: {
        episode,
        userId: user.id,
        remixConfig: {
          cast,
          music,
          overlay,
          remixable,
          metadata: {
            castSelection: cast,
            musicTrack: music,
            overlayStyle: overlay,
            exportRemixable: remixable,
            generatedAt: new Date().toISOString(),
            generatedBy: user.id
          }
        }
      }
    });

    if (videoError) {
      console.error('FFmpeg video engine error:', videoError);
      throw videoError;
    }

    console.log('Video generation initiated:', videoData);

    // Return video URL (this will be updated by the FFmpeg engine)
    return new Response(
      JSON.stringify({
        success: true,
        videoUrl: videoData.videoUrl || videoData.manifestUrl,
        remixMetadata: remixable ? videoData.remixMetadata : null,
        message: 'Video generation started'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Generate remix video error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
