import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Video {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  category: string | null;
  aspect_ratio: string | null;
  duration: number | null;
  file_size: number | null;
  created_at: string;
  updated_at: string;
}

export const useVideos = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setVideos(data || []);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to load videos');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteVideo = useCallback(async (videoId: string, videoUrl: string) => {
    try {
      // Extract the file path from the URL
      const urlParts = videoUrl.split('/videos/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('videos').remove([filePath]);
      }

      const { error: deleteError } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (deleteError) throw deleteError;

      setVideos(prev => prev.filter(v => v.id !== videoId));
      return true;
    } catch (err) {
      console.error('Error deleting video:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return {
    videos,
    loading,
    error,
    refetch: fetchVideos,
    deleteVideo,
  };
};

export default useVideos;
