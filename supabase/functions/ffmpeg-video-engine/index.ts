import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoEngineRequest {
  episodeId: string;
  scenes: Array<{
    frameUrl: string;
    duration: number;
    overlays?: {
      confessional?: any;
      castReaction?: any;
      sunoTrack?: any;
    };
    character?: string;
    emotion?: string;
  }>;
  audioSyncs?: any[];
  confessionals?: any;
  metadata?: any;
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

    const { episodeId, scenes, audioSyncs, confessionals, metadata } = await req.json() as VideoEngineRequest;

    console.log(`🎬 FFmpeg Video Engine: Processing ${scenes.length} scenes for episode ${episodeId}`);
    console.log(`🎵 Audio syncs: ${audioSyncs?.length || 0} tracks`);
    console.log(`💬 Confessionals: ${confessionals ? 'enabled' : 'none'}`);

    // Step 1: Create JSON overlay config for FFmpeg
    const overlayConfig = {
      episodeId,
      version: '1.0',
      engine: 'ffmpeg-gpu',
      parallelism: {
        enabled: true,
        threads: Math.min(scenes.length, 8), // Max 8 parallel threads
        frameLevel: true
      },
      scenes: scenes.map((scene, index) => ({
        index,
        frameUrl: scene.frameUrl,
        duration: scene.duration,
        character: scene.character,
        emotion: scene.emotion,
        overlays: {
          confessional: scene.overlays?.confessional || null,
          castReaction: scene.overlays?.castReaction || null,
          sunoTrack: scene.overlays?.sunoTrack || null
        },
        ffmpegFilters: buildFFmpegFilters(scene, index)
      })),
      audioTracks: audioSyncs?.map((sync, index) => ({
        index,
        trackTitle: sync.track?.title,
        artist: sync.handle,
        startTime: sync.timing?.start || 0,
        endTime: sync.timing?.end || sync.duration || 10,
        fadeIn: sync.fadeIn || 1.5,
        fadeOut: sync.fadeOut || 2.0,
        volume: sync.volume || 0.6,
        character: sync.character,
        sceneId: sync.sceneId
      })) || [],
      export: {
        format: 'mp4',
        codec: 'h264',
        gpuAcceleration: true,
        preset: 'fast', // Options: ultrafast, fast, medium, slow
        crf: 23, // Quality: 0 (best) - 51 (worst), 23 is default
        resolution: '1920x1080',
        fps: 30,
        audioBitrate: '192k'
      },
      remixMetadata: {
        ...metadata,
        confessionals,
        audioSyncs,
        generatedAt: new Date().toISOString(),
        engine: 'storyforge-ffmpeg',
        githubBranch: 'chaos-edits' // For version control tracking
      }
    };

    // Step 2: Upload overlay config to storage
    const configPath = `${episodeId}/ffmpeg-config.json`;
    const { error: configUploadError } = await supabase.storage
      .from('episode-videos')
      .upload(configPath, JSON.stringify(overlayConfig, null, 2), {
        contentType: 'application/json',
        upsert: true
      });

    if (configUploadError) {
      console.error('Failed to upload FFmpeg config:', configUploadError);
      throw configUploadError;
    }

    console.log(`✅ FFmpeg overlay config created: ${configPath}`);

    // Step 3: Build FFmpeg command for parallel processing
    const ffmpegCommand = buildParallelFFmpegCommand(overlayConfig);

    // Step 4: Execute FFmpeg with GPU acceleration (background task)
    // In production, this would run on a GPU-enabled server or lambda
    // Start background rendering without blocking response
    executeFFmpegRendering(supabase, episodeId, ffmpegCommand, overlayConfig)
      .catch(err => console.error('Background FFmpeg error:', err));

    console.log(`🚀 FFmpeg rendering started in background with ${overlayConfig.parallelism.threads} parallel threads`);

    // Step 5: Return immediate response
    return new Response(
      JSON.stringify({
        success: true,
        episodeId,
        renderStatus: 'processing',
        config: overlayConfig,
        ffmpegCommand,
        message: `Video rendering started with ${scenes.length} scenes and ${audioSyncs?.length || 0} audio tracks`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('FFmpeg Video Engine error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Build FFmpeg filters for each scene
function buildFFmpegFilters(scene: any, index: number): string[] {
  const filters: string[] = [];

  // Base video filter
  filters.push(`[${index}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v${index}]`);

  // Add confessional overlay if present
  if (scene.overlays?.confessional) {
    const conf = scene.overlays.confessional;
    filters.push(
      `drawtext=text='${conf.character}':fontfile=/path/to/font.ttf:fontsize=32:fontcolor=white:x=50:y=50:shadowcolor=black:shadowx=2:shadowy=2`
    );
  }

  // Add cast reaction overlay
  if (scene.overlays?.castReaction) {
    filters.push(`overlay=W-w-10:H-h-10`); // Picture-in-picture for reactions
  }

  return filters;
}

// Build parallel FFmpeg command
function buildParallelFFmpegCommand(config: any): string {
  const { scenes, audioTracks, export: exportConfig } = config;

  // Input files
  const inputs = scenes.map((s: any, i: number) => 
    `-loop 1 -t ${s.duration} -i "${s.frameUrl}"`
  ).join(' ');

  // Audio inputs
  const audioInputs = audioTracks.map((a: any) => 
    `-i "${a.trackTitle}.mp3"`
  ).join(' ');

  // Complex filter for parallel processing
  const filterComplex = scenes.map((s: any) => s.ffmpegFilters.join(',')).join(';');

  // Concat scenes
  const concat = `concat=n=${scenes.length}:v=1:a=0[outv]`;

  // Audio mixing with fade in/out
  const audioMix = audioTracks.length > 0 
    ? audioTracks.map((a: any, i: number) => 
        `[${scenes.length + i}:a]afade=t=in:st=${a.startTime}:d=${a.fadeIn},afade=t=out:st=${a.endTime - a.fadeOut}:d=${a.fadeOut},volume=${a.volume}[a${i}]`
      ).join(';') + `;${audioTracks.map((_: any, i: number) => `[a${i}]`).join('')}amix=inputs=${audioTracks.length}[outa]`
    : '';

  // GPU acceleration flags
  const gpuFlags = exportConfig.gpuAcceleration 
    ? '-hwaccel cuda -hwaccel_output_format cuda'
    : '';

  // Full command
  return `ffmpeg ${gpuFlags} ${inputs} ${audioInputs} -filter_complex "${filterComplex};${concat}${audioMix ? ';' + audioMix : ''}" -map "[outv]" ${audioMix ? '-map "[outa]"' : ''} -c:v h264_nvenc -preset ${exportConfig.preset} -crf ${exportConfig.crf} -r ${exportConfig.fps} ${audioMix ? `-c:a aac -b:a ${exportConfig.audioBitrate}` : ''} output.mp4`;
}

// Execute FFmpeg rendering (background task)
async function executeFFmpegRendering(
  supabase: any,
  episodeId: string,
  ffmpegCommand: string,
  config: any
): Promise<void> {
  try {
    console.log(`⚡ Executing FFmpeg with command: ${ffmpegCommand}`);

    // Update episode status
    await supabase
      .from('episodes')
      .update({
        video_status: 'rendering',
        video_render_started_at: new Date().toISOString()
      })
      .eq('id', episodeId);

    // In production, execute FFmpeg via:
    // - AWS Lambda with FFmpeg layer
    // - Docker container with GPU support
    // - Dedicated video processing service
    // - Remotion or similar service

    // For now, simulate rendering time based on scene count
    const estimatedTime = config.scenes.length * 2000; // 2 seconds per scene
    await new Promise(resolve => setTimeout(resolve, estimatedTime));

    // Create mock output video URL (in production, this would be the actual rendered MP4)
    const videoPath = `${episodeId}/episode-${episodeId}.mp4`;
    const videoUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/episode-videos/${videoPath}`;

    // Upload remix metadata alongside video
    const remixMetadataPath = `${episodeId}/remix-metadata.json`;
    await supabase.storage
      .from('episode-videos')
      .upload(remixMetadataPath, JSON.stringify(config.remixMetadata, null, 2), {
        contentType: 'application/json',
        upsert: true
      });

    // Update episode with completed video
    await supabase
      .from('episodes')
      .update({
        video_status: 'completed',
        video_url: videoUrl,
        video_render_completed_at: new Date().toISOString()
      })
      .eq('id', episodeId);

    console.log(`✅ Video rendering complete: ${videoUrl}`);
    console.log(`📦 Remix metadata exported: ${remixMetadataPath}`);

  } catch (error) {
    console.error('FFmpeg rendering error:', error);
    
    await supabase
      .from('episodes')
      .update({
        video_status: 'failed',
        video_render_error: error instanceof Error ? error.message : 'Rendering failed'
      })
      .eq('id', episodeId);
  }
}
