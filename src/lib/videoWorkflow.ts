import { supabase } from '@/integrations/supabase/client';

export interface VideoPayload {
  character: string;
  mood: string;
  overlays: string[];
  music: string;
  episodeId: string;
}

/**
 * Triggers the real video generation pipeline:
 * 1. Calls generate-video edge function (which invokes ultra-video-bot for AI scene images)
 * 2. Episode gets a manifest URL with real AI-generated scene frames
 * 3. Client-side FFmpeg/Remotion compiles frames into playable MP4
 */
export const triggerVideoGeneration = async (payload: VideoPayload): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  console.log('🎬 Starting real video generation pipeline...');

  const { data, error } = await supabase.functions.invoke('generate-video', {
    body: { episodeId: payload.episodeId },
  });

  if (error) throw error;

  console.log('✅ Video generation pipeline started:', data?.message);
};

export const fetchSunoTrack = async (trackName: string): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('suno-music-generator', {
      body: { prompt: trackName, style: 'reality-tv', duration: 30 },
    });
    if (error) throw error;
    return data.audioUrl || data.musicUrl || `Suno_${trackName}.mp3`;
  } catch (error) {
    console.error('Suno track fetch error:', error);
    return 'Suno_djluckluck.mp3';
  }
};

// Command handlers for slash commands
export const commands = {
  '/remix': async (payload: VideoPayload) => {
    return await triggerVideoGeneration(payload);
  },
  '/suno': async (trackName: string) => {
    return await fetchSunoTrack(trackName);
  },
};
