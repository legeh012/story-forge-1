import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type VoiceType = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

interface VoiceOptions {
  text: string;
  voice?: VoiceType;
  speed?: number;
  episodeId?: string;
}

export const useGodlikeVoice = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const generateVoice = async ({ text, voice = 'nova', speed = 1.0, episodeId }: VoiceOptions) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('godlike-voice-bot', {
        body: { text, voice, speed, episodeId }
      });

      if (error) throw error;

      // Convert base64 to audio URL
      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      toast({
        title: "⚡ ULTRA-NATURAL Voice Generated",
        description: `${data.quality} quality with ${data.enhancement?.emotion || 'natural'} emotion • ${voice} voice`,
      });

      return { audioUrl: url, ...data };
    } catch (error) {
      console.error('Voice generation error:', error);
      toast({
        title: "Voice Generation Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const mixAudio = async (episodeId: string, scenes: any[], enhancementLevel = 'ultra') => {
    try {
      const { data, error } = await supabase.functions.invoke('audio-mixer-bot', {
        body: { episodeId, scenes, enhancementLevel }
      });

      if (error) throw error;

      toast({
        title: "🎵 GODLIKE Audio Mix Complete",
        description: `${data.quality} multi-track audio in ${data.estimatedMixTime}`,
      });

      return data;
    } catch (error) {
      console.error('Audio mixing error:', error);
      toast({
        title: "Audio Mixing Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
      throw error;
    }
  };

  const addSoundEffects = async (scene: string, mood: string, duration = 3.0) => {
    try {
      const { data, error } = await supabase.functions.invoke('sound-effects-bot', {
        body: { scene, mood, duration }
      });

      if (error) throw error;

      toast({
        title: "🔊 GODLIKE Sound Effects Added",
        description: `${data.effectsCount} effects applied`,
      });

      return data;
    } catch (error) {
      console.error('Sound effects error:', error);
      throw error;
    }
  };

  return {
    generateVoice,
    mixAudio,
    addSoundEffects,
    isGenerating,
    audioUrl,
  };
};
