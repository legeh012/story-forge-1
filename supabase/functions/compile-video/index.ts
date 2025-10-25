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

    console.log('🎬 Starting actual MP4 video compilation with FFmpeg...');

    // Import FFmpeg dynamically
    const { FFmpeg } = await import('https://esm.sh/@ffmpeg/ffmpeg@0.12.15');
    const { toBlobURL } = await import('https://esm.sh/@ffmpeg/util@0.12.2');
    
    const ffmpeg = new FFmpeg();
    
    // Load FFmpeg
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    
    console.log('✅ FFmpeg loaded successfully');

    // Download and write frames to FFmpeg filesystem
    for (let i = 0; i < frameUrls.length; i++) {
      const response = await fetch(frameUrls[i]);
      const arrayBuffer = await response.arrayBuffer();
      await ffmpeg.writeFile(`frame${i.toString().padStart(4, '0')}.png`, new Uint8Array(arrayBuffer));
      console.log(`📥 Downloaded frame ${i + 1}/${frameUrls.length}`);
    }

    // Create concat file for frame durations
    let concatContent = '';
    for (let i = 0; i < frameUrls.length; i++) {
      concatContent += `file 'frame${i.toString().padStart(4, '0')}.png'\n`;
      concatContent += `duration ${frameDurations[i] || 5}\n`;
    }
    if (frameUrls.length > 0) {
      concatContent += `file 'frame${(frameUrls.length - 1).toString().padStart(4, '0')}.png'\n`;
    }
    
    await ffmpeg.writeFile('concat.txt', new TextEncoder().encode(concatContent));

    // Run FFmpeg to create MP4
    console.log('🎥 Compiling frames into MP4...');
    await ffmpeg.exec([
      '-f', 'concat',
      '-safe', '0',
      '-i', 'concat.txt',
      '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'medium',
      '-crf', '23',
      '-movflags', '+faststart',
      'output.mp4'
    ]);
    
    console.log('✅ FFmpeg compilation complete');

    // Read the output MP4 file
    const mp4Data = await ffmpeg.readFile('output.mp4') as Uint8Array;

    // Upload MP4 to storage
    const videoPath = `${userId}/${episodeId}/episode.mp4`;
    const { error: uploadError } = await supabase.storage
      .from('episode-videos')
      .upload(videoPath, mp4Data, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (uploadError) {
      console.error('Failed to upload MP4:', uploadError);
      throw uploadError;
    }

    const videoUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/episode-videos/${videoPath}`;

    console.log(`✅ MP4 video created: ${videoUrl}`);

    // Update episode with MP4 URL
    await supabase
      .from('episodes')
      .update({
        video_status: 'completed',
        video_url: videoUrl,
        video_render_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', episodeId);

    console.log('🎥 Real MP4 video compilation completed');

    return new Response(
      JSON.stringify({
        success: true,
        videoUrl,
        format: 'mp4',
        totalFrames: frameUrls.length,
        totalDuration: frameDurations.reduce((sum, d) => sum + d, 0),
        message: 'Real MP4 video created with FFmpeg'
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