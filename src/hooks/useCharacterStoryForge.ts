import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { luckyCharacterSchema } from '@/data/luckyCharacterSchema';

export const useCharacterStoryForge = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateConfessional = async (
    character: any,
    sceneContext: string,
    emotionalState: string
  ) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('confessional-logic-bot', {
        body: {
          character,
          sceneContext,
          emotionalState
        }
      });

      if (error) throw error;

      toast({
        title: "Confessional Generated",
        description: `${character.name}'s confessional moment created with audio overlay`
      });

      return data;
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate confessional",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const syncSunoAudio = async (
    scenes: any[],
    characters: any[],
    episodeId: string
  ) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('suno-audio-sync-bot', {
        body: {
          scenes,
          characters,
          episodeId
        }
      });

      if (error) throw error;

      toast({
        title: "Audio Synced",
        description: `${data.audioSyncs?.length || 0} Suno tracks synced to scenes`
      });

      return data;
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync audio",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper to get audio track for scene
  const selectAudioForScene = (sceneEmotion: string, character?: any) => {
    if (character?.metadata?.modules?.sunoAlbumSync) {
      return luckyCharacterSchema.storyForgeHooks.selectAudioOverlay(sceneEmotion);
    }
    return null;
  };

  // Helper to get emotional pivot
  const getEmotionalPivot = (currentState: string, trigger: string) => {
    return luckyCharacterSchema.storyForgeHooks.getEmotionalPivot(currentState, trigger);
  };

  return {
    generateConfessional,
    syncSunoAudio,
    selectAudioForScene,
    getEmotionalPivot,
    isGenerating
  };
};
