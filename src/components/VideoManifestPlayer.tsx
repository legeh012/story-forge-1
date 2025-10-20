import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface VideoFrame {
  url: string;
  duration: number;
  index: number;
}

interface VideoManifest {
  type: string;
  episodeId: string;
  frames: VideoFrame[];
  totalDuration: number;
  metadata: any;
  format: string;
}

interface VideoManifestPlayerProps {
  manifestUrl: string;
  className?: string;
  controls?: boolean;
}

export const VideoManifestPlayer = ({ manifestUrl, className = '', controls = true }: VideoManifestPlayerProps) => {
  const [manifest, setManifest] = useState<VideoManifest | null>(null);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const loadManifest = async () => {
      try {
        setLoading(true);
        const response = await fetch(manifestUrl);
        if (!response.ok) throw new Error('Failed to load video manifest');
        const data = await response.json();
        setManifest(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load video');
        console.error('Manifest load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadManifest();
  }, [manifestUrl]);

  useEffect(() => {
    if (!manifest || !isPlaying) return;

    const currentFrame = manifest.frames[currentFrameIndex];
    if (!currentFrame) {
      setIsPlaying(false);
      setCurrentFrameIndex(0);
      return;
    }

    const duration = (currentFrame.duration || 5) * 1000; // Convert to milliseconds

    timeoutRef.current = window.setTimeout(() => {
      const nextIndex = currentFrameIndex + 1;
      if (nextIndex >= manifest.frames.length) {
        setIsPlaying(false);
        setCurrentFrameIndex(0);
      } else {
        setCurrentFrameIndex(nextIndex);
      }
    }, duration);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [manifest, currentFrameIndex, isPlaying]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const restart = () => {
    setCurrentFrameIndex(0);
    setIsPlaying(true);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-black ${className}`}>
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  if (error || !manifest) {
    return (
      <div className={`flex items-center justify-center bg-black text-white p-8 ${className}`}>
        <p>{error || 'Failed to load video'}</p>
      </div>
    );
  }

  const currentFrame = manifest.frames[currentFrameIndex];

  return (
    <div className={`relative ${className}`}>
      <img
        src={currentFrame.url}
        alt={`Frame ${currentFrameIndex + 1}`}
        className="w-full h-full object-contain bg-black"
      />
      
      {controls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlayPause}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded transition-colors"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={restart}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded transition-colors"
            >
              Restart
            </button>
            <span className="text-white text-sm">
              Frame {currentFrameIndex + 1} / {manifest.frames.length}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="mt-2 w-full bg-white/20 h-1 rounded-full overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-300"
              style={{ width: `${((currentFrameIndex + 1) / manifest.frames.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};