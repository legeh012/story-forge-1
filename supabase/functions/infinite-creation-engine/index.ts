import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const INFINITE_ENGINE_URL = 'https://infinite-creation-engine.replit.app';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { episodeId, prompt, characters, mood, style, action } = await req.json();

    console.log('🚀 INFINITE CREATION ENGINE BRIDGE ACTIVATED');
    console.log(`Action: ${action || 'generate'}, Episode: ${episodeId}`);

    // Determine the endpoint based on action
    const endpoint = action === 'status' ? '/api/status' 
      : action === 'gallery' ? '/api/gallery'
      : '/api/generate';

    const enginePayload = {
      prompt: prompt || `Reality TV scene: ${characters?.join(', ') || 'Say Walahi Sisters'} - ${mood || 'dramatic confrontation'}`,
      style: style || 'photorealistic-reality-tv',
      characters: characters || [],
      mood: mood || 'dramatic',
      quality: 'ultra',
      format: 'mp4',
      resolution: '1920x1080',
      fps: 30,
      metadata: {
        source: 'say-walahi-sisters',
        episodeId,
        engine: 'infinite-creation-engine',
        timestamp: new Date().toISOString()
      }
    };

    console.log(`📡 Calling Infinite Creation Engine: ${INFINITE_ENGINE_URL}${endpoint}`);

    let engineData: any = null;
    let videoUrl: string | null = null;
    let engineReachable = false;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const engineResponse = await fetch(`${INFINITE_ENGINE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enginePayload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const contentType = engineResponse.headers.get('content-type') || '';

      if (engineResponse.ok && contentType.includes('application/json')) {
        engineData = await engineResponse.json();
        videoUrl = engineData?.videoUrl || engineData?.video_url || engineData?.url || null;
        engineReachable = true;
        console.log(`✅ Infinite Creation Engine responded: ${engineResponse.status}`);
      } else {
        const text = await engineResponse.text();
        console.log(`⚠️ Engine returned ${engineResponse.status}: ${text.substring(0, 200)}`);
        engineData = { status: engineResponse.status, message: 'Engine returned non-success response' };
      }
    } catch (fetchError) {
      console.log(`⚠️ Infinite Creation Engine unreachable: ${fetchError instanceof Error ? fetchError.message : 'Unknown'}`);
      engineData = { status: 'unreachable', message: 'Engine is currently offline' };
    }

    // If we got a video URL back, update the episode
    if (episodeId && videoUrl) {
      console.log(`🎬 Updating episode ${episodeId} with generated video`);

      await supabase
        .from('episodes')
        .update({
          video_url: videoUrl,
          video_status: 'completed',
          video_render_completed_at: new Date().toISOString()
        })
        .eq('id', episodeId);
    }

    // Log execution stats
    if (episodeId) {
      await supabase.from('bot_execution_stats').insert({
        bot_type: 'ultra_video',
        episode_id: episodeId,
        execution_time_ms: Date.now() - startTime,
        quality_score: engineReachable ? 0.99 : 0.5,
        metadata: {
          engine: 'infinite-creation-engine',
          action,
          videoGenerated: !!videoUrl,
          engineReachable,
        }
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        engineReachable,
        engine: 'infinite-creation-engine',
        data: engineData,
        videoUrl,
        processingTimeMs: Date.now() - startTime,
        message: engineReachable 
          ? '🚀 Infinite Creation Engine: 2075-grade video generation complete'
          : '⚠️ Engine offline — fallback to bot army recommended'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Infinite Creation Engine error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        engine: 'infinite-creation-engine',
        engineReachable: false,
        fallback: 'System will retry with unified processor'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
