import { supabase } from '@/integrations/supabase/client';

export interface VideoPayload {
  character: string;
  mood: string;
  overlays: string[];
  music: string;
  episodeId: string;
}

export const fetchSunoTrack = async (trackName: string): Promise<string> => {
  try {
    // Call the suno-music-generator edge function
    const { data, error } = await supabase.functions.invoke('suno-music-generator', {
      body: {
        prompt: trackName,
        style: 'reality-tv',
        duration: 30
      }
    });

    if (error) throw error;
    
    return data.audioUrl || data.musicUrl || `Suno_${trackName}.mp3`;
  } catch (error) {
    console.error('Suno track fetch error:', error);
    // Fallback to default track
    return 'Suno_djluckluck.mp3';
  }
};

export const injectOverlays = async (overlayList: string[]): Promise<void> => {
  for (const overlay of overlayList) {
    await applyOverlayToScene(overlay);
  }
};

const applyOverlayToScene = async (overlay: string): Promise<void> => {
  console.log(`Applying overlay: ${overlay}`);
  // Overlay application logic handled by unified processor
  return Promise.resolve();
};

export const attachMusicToEpisode = async (
  episodeId: string, 
  musicTrack: string
): Promise<void> => {
  try {
    // Store music track reference in the episode
    console.log(`🎵 Attaching music track ${musicTrack} to episode ${episodeId}`);
    // Music attachment will be handled by the unified processor
    return Promise.resolve();
  } catch (error) {
    console.error('Music attachment error:', error);
  }
};

export const generateCinematicVideo = async (params: {
  character: string;
  mood: string;
  overlays: string[];
  music: string;
  episodeId: string;
}): Promise<{ url: string; overlays: string[]; music: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Call god-level-unified-processor for VH1/Netflix quality
    const { data, error } = await supabase.functions.invoke('god-level-unified-processor', {
      body: {
        episodeId: params.episodeId,
        userId: user.id,
        frames: params.overlays,
        audioUrl: params.music,
        quality: 'ultra',
        renderSettings: {
          resolution: '1080p',
          frameRate: 24,
          transitions: ['fade', 'slide', 'zoom'],
          audio_file: params.music,
          character: params.character,
          mood: params.mood
        }
      }
    });

    if (error) throw error;

    return {
      url: data.videoUrl,
      overlays: params.overlays,
      music: params.music
    };
  } catch (error) {
    console.error('Cinematic video generation error:', error);
    throw error;
  }
};

export const exportVideoToVault = async (
  video: { url: string; overlays: string[]; music: string },
  episodeId: string
): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Save video to vault (update episode with video URL and status)
    const { error } = await supabase
      .from('episodes')
      .update({
        video_url: video.url,
        video_status: 'completed'
      })
      .eq('id', episodeId);

    if (error) throw error;

    console.log(`✅ Video exported to vault for episode ${episodeId}`);
    console.log(`📼 Video URL: ${video.url}`);
    console.log(`🎨 Overlays: ${video.overlays.join(', ')}`);
    console.log(`🎵 Music: ${video.music}`);
  } catch (error) {
    console.error('Vault export error:', error);
    throw error;
  }
};

export const triggerVideoGeneration = async (payload: VideoPayload): Promise<void> => {
  try {
    // Step 1: Inject overlays
    console.log('🎨 Injecting overlays...');
    await injectOverlays(payload.overlays);

    // Step 2: Sync music from Suno
    console.log('🎵 Fetching Suno track...');
    const musicTrack = await fetchSunoTrack(payload.music);
    await attachMusicToEpisode(payload.episodeId, musicTrack);

    // Step 3: Generate cinematic video with unified processor
    console.log('🎬 Generating cinematic video with god-level-unified-processor...');
    const video = await generateCinematicVideo({
      character: payload.character,
      mood: payload.mood,
      overlays: payload.overlays,
      music: musicTrack,
      episodeId: payload.episodeId,
    });

    // Step 4: Export to vault
    console.log('💾 Exporting to remix vault...');
    await exportVideoToVault(video, payload.episodeId);

    console.log('✅ Complete video generation pipeline finished!');
  } catch (error) {
    console.error('Video generation pipeline error:', error);
    throw error;
  }
};

// Command handlers for slash commands
export const commands = {
  '/remix': async (payload: VideoPayload) => {
    return await triggerVideoGeneration(payload);
  },
  '/inject': async (overlays: string[]) => {
    return await injectOverlays(overlays);
  },
  '/suno': async (trackName: string) => {
    return await fetchSunoTrack(trackName);
  },
  '/export': async (video: any, episodeId: string) => {
    return await exportVideoToVault(video, episodeId);
  }
};
