import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompileRequest {
  episodeId: string;
  userId: string;
  frameUrls: string[];
  frameDurations: number[];
  metadata: any;
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

    const { episodeId, userId, frameUrls, frameDurations, metadata } = await req.json() as CompileRequest;

    console.log(`🎬 Starting video compilation for episode ${episodeId}`);
    console.log(`📊 Processing ${frameUrls.length} frames`);

    // In a production environment, you would use FFmpeg or a video processing service
    // For now, we'll create an HTML5 video player that cycles through images
    // This is a placeholder - in production you'd use:
    // - FFmpeg WASM
    // - Remotion
    // - AWS Elemental MediaConvert
    // - Cloudinary Video API
    // - Shotstack API

    // For MVP: Create a video manifest that the frontend can use
    const videoManifest = {
      type: 'image-sequence',
      episodeId,
      frames: frameUrls.map((url, index) => ({
        url,
        duration: frameDurations[index] || 5,
        index
      })),
      totalDuration: frameDurations.reduce((sum, d) => sum + d, 0),
      metadata,
      createdAt: new Date().toISOString(),
      format: 'image-sequence', // Will be 'mp4' when we add real video compilation
    };

    // Upload manifest to storage
    const manifestPath = `${userId}/${episodeId}/video-manifest.json`;
    const { error: uploadError } = await supabase.storage
      .from('episode-videos')
      .upload(manifestPath, JSON.stringify(videoManifest, null, 2), {
        contentType: 'application/json',
        upsert: true
      });

    if (uploadError) {
      console.error('Failed to upload video manifest:', uploadError);
      throw uploadError;
    }

    const manifestUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/episode-videos/${manifestPath}`;

    console.log(`✅ Video manifest created: ${manifestUrl}`);

    // TODO: Implement actual MP4 compilation here
    // For now, we use the manifest approach
    // Future implementation should use FFmpeg or video service

    // Update episode with manifest URL (temporary solution)
    await supabase
      .from('episodes')
      .update({
        video_status: 'completed',
        video_url: manifestUrl,
        video_render_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', episodeId);

    console.log('🎥 Video compilation completed');

    return new Response(
      JSON.stringify({
        success: true,
        manifestUrl,
        format: 'image-sequence',
        totalFrames: frameUrls.length,
        totalDuration: videoManifest.totalDuration,
        message: 'Video manifest created (image sequence format)'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Video compilation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});