import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductionRequest {
  episodeId: string;
  uploadToYouTube?: boolean;
}

// Say Walahi Sisters - The Diaspora Characters
const sayWalahiCharacters = [
  {
    name: "Lucky",
    role: "The Founder - Visionary Architect",
    personality: "Builds cinematic OSs while flipping tropes into monetization, always architecting the next cultural disruption",
    voice: "commanding, visionary, powerful",
    appearance: "rich espresso skin, commanding presence, flowing waves under designer headwrap, power suits with statement jewelry"
  },
  {
    name: "Luul",
    role: "The Flamekeeper - Cultural Anchor",
    personality: "Holds the ancestral line and lights the confessional fire, pure legacy and cultural wisdom",
    voice: "ancestral, wise, powerful",
    appearance: "warm caramel skin, sharp features with ancestral wisdom, sleek bun under traditional hijab, elegant traditional meets modern power"
  },
  {
    name: "Samara",
    role: "The Strategist - Quiet Architect",
    personality: "Precision over noise. Codes emotional logic into every scene and sees monetization arcs before they drop",
    voice: "calculating, precise, strategic",
    appearance: "honey beige skin, calculating eyes with strategic smile, sleek styling under minimalist hijab, architectural precision"
  },
  {
    name: "Ayaan",
    role: "The Architect - Systems Queen",
    personality: "Builds backend brilliance and front-end finesse. Her overlays are schema poetry in motion",
    voice: "tech-forward, systematic, poetic",
    appearance: "deep mahogany skin, focused intensity, natural curls under bold printed wrap, tech-forward elegance"
  },
  {
    name: "Hani",
    role: "The Oracle - Spiritual Strategist",
    personality: "Reads trauma maps like episode scripts. Her energy grid is the show's emotional compass",
    voice: "spiritual, knowing, compassionate",
    appearance: "soft cinnamon skin, knowing eyes with spiritual presence, flowing hair under elegant hijab, spiritual elegance"
  },
  {
    name: "Zahra",
    role: "The Flame - Satirical Provocateur",
    personality: "Weaponizes humor to dismantle tropes. Her confessionals are viral think pieces",
    voice: "sharp, satirical, provocative",
    appearance: "honey beige skin, sharp wit with provocative smile, bold styling under statement hijab, provocateur chic"
  },
  {
    name: "Nasra",
    role: "Sweetheart - Emotional Core",
    personality: "The softness in the chaos. Her vulnerability is her superpower and her storyline always lands perfectly",
    voice: "gentle, heartfelt, vulnerable",
    appearance: "deep mahogany skin, gentle features with heartfelt expression, soft styling under pastel hijab, sweetheart aesthetic"
  },
  {
    name: "Amal",
    role: "The Instigator - Chaos Console",
    personality: "Thrives on pivots, plot twists, and viral disruption. Every scene becomes a cinematic upgrade",
    voice: "mischievous, dynamic, disruptive",
    appearance: "warm bronze skin, mischievous energy, dynamic styling under bold chiffon hijab, chaos chic aesthetic"
  }
];

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

    const { episodeId, uploadToYouTube = false }: ProductionRequest = await req.json();

    console.log('🎬 EPISODE PRODUCTION PIPELINE STARTED');
    console.log('Episode ID:', episodeId);
    console.log('Upload to YouTube:', uploadToYouTube);

    // Get episode details
    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', episodeId)
      .single();

    if (episodeError || !episode) {
      throw new Error('Episode not found');
    }

    // Update status to processing
    await supabase
      .from('episodes')
      .update({ 
        video_status: 'processing',
        video_render_started_at: new Date().toISOString()
      })
      .eq('id', episodeId);

    console.log('📝 Episode:', episode.title);

    // STEP 1: God Mode Production (Script, Music, Scenes, Voiceovers, Images)
    console.log('⚡ STEP 1: Activating God Mode Reality TV Production...');
    const { data: godModeResult, error: godModeError } = await supabase.functions.invoke('reality-tv-god-mode', {
      body: {
        episodeId: episodeId,
        projectId: episode.project_id,
        mode: 'ultra',
        characters: sayWalahiCharacters // Pass diaspora sisters data
      }
    });

    if (godModeError) {
      console.error('God Mode failed:', godModeError);
      await supabase
        .from('episodes')
        .update({ 
          video_status: 'failed',
          video_render_error: `God Mode failed: ${godModeError.message}`
        })
        .eq('id', episodeId);
      throw godModeError;
    }

    console.log('✅ God Mode Complete - Script, scenes, voiceovers generated');

    // STEP 2: Get updated episode with storyboard
    const { data: updatedEpisode } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', episodeId)
      .single();

    if (!updatedEpisode?.storyboard || !Array.isArray(updatedEpisode.storyboard)) {
      throw new Error('No storyboard generated');
    }

    // STEP 3: FFmpeg Video Compilation with God-Level Processing
    console.log('🎥 STEP 2: FFmpeg God-Level Video Compilation...');
    
    // Prepare frames for FFmpeg
    const frames = updatedEpisode.storyboard.map((scene: any) => ({
      url: scene.imageUrl || scene.image_url,
      duration: scene.duration || 5
    }));

    const { data: ffmpegResult, error: ffmpegError } = await supabase.functions.invoke('god-level-ffmpeg-compiler', {
      body: {
        episode: {
          id: episodeId,
          title: episode.title,
          synopsis: episode.synopsis
        },
        frames: frames,
        audioUrl: updatedEpisode.audio_url,
        quality: 'ultra'
      }
    });

    if (ffmpegError) {
      console.error('FFmpeg compilation failed:', ffmpegError);
      await supabase
        .from('episodes')
        .update({ 
          video_status: 'failed',
          video_render_error: `FFmpeg failed: ${ffmpegError.message}`
        })
        .eq('id', episodeId);
      throw ffmpegError;
    }

    const videoUrl = ffmpegResult.videoUrl || ffmpegResult.manifestUrl;
    console.log('✅ FFmpeg Compilation Complete');
    console.log('Video URL:', videoUrl);

    // Update episode with video
    await supabase
      .from('episodes')
      .update({ 
        video_status: 'completed',
        video_url: videoUrl,
        video_manifest_url: ffmpegResult.manifestUrl,
        video_render_completed_at: new Date().toISOString()
      })
      .eq('id', episodeId);

    let youtubeUrl = null;

    // STEP 4: Upload to YouTube (if requested)
    if (uploadToYouTube && videoUrl) {
      console.log('📺 STEP 3: Uploading to YouTube...');
      
      try {
        const { data: youtubeResult, error: youtubeError } = await supabase.functions.invoke('youtube-uploader', {
          body: {
            videoUrl: videoUrl,
            title: episode.title,
            description: episode.synopsis || 'Generated by StoryForge Reality TV',
            episodeId: episodeId
          }
        });

        if (youtubeError) {
          console.error('YouTube upload failed:', youtubeError);
          console.log('⚠️ Continuing without YouTube upload');
        } else {
          youtubeUrl = youtubeResult.youtubeUrl;
          console.log('✅ YouTube Upload Complete:', youtubeUrl);
        }
      } catch (youtubeErr) {
        console.error('YouTube upload error:', youtubeErr);
        console.log('⚠️ Episode production completed but YouTube upload failed');
      }
    }

    console.log('🎉 EPISODE PRODUCTION COMPLETE');

    return new Response(
      JSON.stringify({
        success: true,
        episodeId: episodeId,
        videoUrl: videoUrl,
        manifestUrl: ffmpegResult.manifestUrl,
        youtubeUrl: youtubeUrl,
        godModeExecutionLog: godModeResult?.executionLog,
        cast: sayWalahiCharacters.map(c => ({ name: c.name, role: c.role })),
        ffmpegProcessing: {
          godLevelBots: [
            'god-level-scene-composer-bot',
            'frame-optimizer-bot',
            'god-level-color-grader-bot',
            'video-quality-enhancer-bot',
            'god-level-effects-bot',
            'audio-sync-bot',
            'god-level-audio-master-bot'
          ],
          status: 'completed'
        },
        message: youtubeUrl 
          ? `Episode featuring Say Walahi Sisters produced and uploaded to YouTube successfully`
          : `Episode featuring Say Walahi Sisters produced successfully`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ EPISODE PRODUCTION FAILED:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
