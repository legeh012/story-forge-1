import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompilationRequest {
  episodeId: string;
  userId: string;
  frames: Array<{ url: string; duration: number }>;
  audioUrl?: string;
  quality?: 'ultra' | 'premium' | 'broadcast';
}

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

    const { episodeId, userId, frames, audioUrl, quality = 'ultra' } = await req.json() as CompilationRequest;

    console.log(`🎬 GOD-LEVEL FFMPEG COMPILER ACTIVATED`);
    console.log(`📊 Episode: ${episodeId}`);
    console.log(`🎥 Frames: ${frames.length}`);
    console.log(`⚡ Quality: ${quality.toUpperCase()}`);
    console.log(`🎵 Audio: ${audioUrl ? 'Yes' : 'No'}`);

    // Phase 1: Frame Optimization Bot
    console.log('\n🔧 PHASE 1: Frame Optimization');
    const { data: optimizedFrames, error: optimizeError } = await supabase.functions.invoke('frame-optimizer-bot', {
      body: {
        frames,
        episodeId,
        quality
      }
    });

    if (optimizeError) {
      console.error('Frame optimization failed:', optimizeError);
      throw optimizeError;
    }

    console.log(`✅ Frames optimized: ${optimizedFrames.optimizedCount} frames processed`);

    // Phase 2: Video Quality Enhancement Bot
    console.log('\n🎨 PHASE 2: Video Quality Enhancement');
    const { data: qualitySettings, error: qualityError } = await supabase.functions.invoke('video-quality-enhancer-bot', {
      body: {
        frames: optimizedFrames.frames,
        quality,
        targetResolution: '1920x1080',
        targetFPS: 30
      }
    });

    if (qualityError) {
      console.error('Quality enhancement failed:', qualityError);
      throw qualityError;
    }

    console.log(`✅ Quality enhanced: ${qualitySettings.codec} @ ${qualitySettings.bitrate}`);

    // Phase 3: Audio Sync Bot (if audio exists)
    let audioSettings = null;
    if (audioUrl) {
      console.log('\n🎵 PHASE 3: Audio Synchronization');
      const { data: syncedAudio, error: audioError } = await supabase.functions.invoke('audio-sync-bot', {
        body: {
          audioUrl,
          totalDuration: frames.reduce((sum, f) => sum + f.duration, 0),
          frames: optimizedFrames.frames
        }
      });

      if (audioError) {
        console.error('Audio sync failed:', audioError);
        // Continue without audio rather than failing
        console.log('⚠️ Continuing without audio...');
      } else {
        audioSettings = syncedAudio;
        console.log(`✅ Audio synced: ${audioSettings.format} @ ${audioSettings.bitrate}`);
      }
    }

    // Phase 4: FFmpeg Compilation
    console.log('\n🎬 PHASE 4: God-Level FFmpeg Compilation');
    console.log('📦 Loading FFmpeg WASM...');

    const { FFmpeg } = await import('https://esm.sh/@ffmpeg/ffmpeg@0.12.15');
    const { toBlobURL } = await import('https://esm.sh/@ffmpeg/util@0.12.2');
    
    const ffmpeg = new FFmpeg();
    
    // Load FFmpeg with logging
    ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });

    ffmpeg.on('progress', ({ progress, time }) => {
      console.log(`[FFmpeg Progress] ${(progress * 100).toFixed(1)}% - ${(time / 1000000).toFixed(2)}s`);
    });

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    
    console.log('✅ FFmpeg loaded successfully');

    // Download and write optimized frames
    console.log(`📥 Downloading ${optimizedFrames.frames.length} optimized frames...`);
    for (let i = 0; i < optimizedFrames.frames.length; i++) {
      const response = await fetch(optimizedFrames.frames[i].url);
      const arrayBuffer = await response.arrayBuffer();
      await ffmpeg.writeFile(
        `frame${i.toString().padStart(4, '0')}.png`, 
        new Uint8Array(arrayBuffer)
      );
      
      if (i % 10 === 0) {
        console.log(`📥 Downloaded ${i + 1}/${optimizedFrames.frames.length} frames`);
      }
    }

    // Create concat file with frame durations
    let concatContent = '';
    for (let i = 0; i < optimizedFrames.frames.length; i++) {
      concatContent += `file 'frame${i.toString().padStart(4, '0')}.png'\n`;
      concatContent += `duration ${optimizedFrames.frames[i].duration}\n`;
    }
    // Add last frame again for proper duration
    if (optimizedFrames.frames.length > 0) {
      const lastIndex = optimizedFrames.frames.length - 1;
      concatContent += `file 'frame${lastIndex.toString().padStart(4, '0')}.png'\n`;
    }
    
    await ffmpeg.writeFile('concat.txt', new TextEncoder().encode(concatContent));

    // Build FFmpeg command with quality settings
    const ffmpegArgs = [
      '-f', 'concat',
      '-safe', '0',
      '-i', 'concat.txt',
      '-vf', `scale=${qualitySettings.resolution}:force_original_aspect_ratio=decrease,pad=${qualitySettings.resolution}:(ow-iw)/2:(oh-ih)/2`,
      '-c:v', qualitySettings.codec,
      '-pix_fmt', 'yuv420p',
      '-preset', qualitySettings.preset,
      '-crf', qualitySettings.crf.toString(),
      '-b:v', qualitySettings.bitrate,
      '-movflags', '+faststart',
      '-r', qualitySettings.fps.toString()
    ];

    // Add audio if available
    if (audioSettings && audioUrl) {
      console.log('🎵 Adding audio track...');
      const audioResponse = await fetch(audioUrl);
      const audioBuffer = await audioResponse.arrayBuffer();
      await ffmpeg.writeFile('audio.mp3', new Uint8Array(audioBuffer));
      
      ffmpegArgs.push(
        '-i', 'audio.mp3',
        '-c:a', audioSettings.codec,
        '-b:a', audioSettings.bitrate,
        '-shortest'
      );
    }

    ffmpegArgs.push('output.mp4');

    // Execute FFmpeg
    console.log('🎬 Starting FFmpeg compilation...');
    console.log(`📋 FFmpeg command: ${ffmpegArgs.join(' ')}`);
    
    await ffmpeg.exec(ffmpegArgs);
    
    console.log('✅ FFmpeg compilation complete');

    // Read the output MP4
    const mp4Data = await ffmpeg.readFile('output.mp4') as Uint8Array;
    const fileSize = (mp4Data.length / 1024 / 1024).toFixed(2);
    console.log(`📦 Output file size: ${fileSize} MB`);

    // Upload MP4 to storage
    const videoPath = `${userId}/${episodeId}/episode.mp4`;
    console.log(`📤 Uploading to: ${videoPath}`);
    
    const { error: uploadError } = await supabase.storage
      .from('episode-videos')
      .upload(videoPath, mp4Data, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload failed:', uploadError);
      throw uploadError;
    }

    const videoUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/episode-videos/${videoPath}`;
    console.log(`✅ Video uploaded: ${videoUrl}`);

    // Update episode
    await supabase
      .from('episodes')
      .update({
        video_status: 'completed',
        video_url: videoUrl,
        video_render_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', episodeId);

    const totalTime = Date.now() - startTime;
    const duration = frames.reduce((sum, f) => sum + f.duration, 0);

    console.log('\n🎉 GOD-LEVEL COMPILATION COMPLETE');
    console.log(`⏱️  Total time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`🎥 Video duration: ${duration.toFixed(1)}s`);
    console.log(`📦 File size: ${fileSize} MB`);
    console.log(`🎬 Quality: ${quality.toUpperCase()}`);

    return new Response(
      JSON.stringify({
        success: true,
        videoUrl,
        format: 'mp4',
        quality,
        stats: {
          totalFrames: frames.length,
          duration,
          fileSize: `${fileSize} MB`,
          compilationTime: `${(totalTime / 1000).toFixed(2)}s`,
          codec: qualitySettings.codec,
          resolution: qualitySettings.resolution,
          bitrate: qualitySettings.bitrate,
          hasAudio: !!audioSettings
        },
        message: '🎬 God-level MP4 video created with premium FFmpeg compilation'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('🚨 GOD-LEVEL COMPILER ERROR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        message: 'God-level FFmpeg compilation failed - check logs'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
