import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Maximize, Download, Share2 } from 'lucide-react';
import { VideoManifestPlayer } from './VideoManifestPlayer';
import { toast } from 'sonner';

interface EpisodeVideoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string | null;
  episodeTitle?: string;
  episodeNumber?: number;
  season?: number;
  autoPlay?: boolean;
}

export function EpisodeVideoPlayer({
  isOpen,
  onClose,
  videoUrl,
  episodeTitle = 'Episode',
  episodeNumber,
  season,
  autoPlay = false
}: EpisodeVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    if (isOpen && autoPlay) {
      setIsPlaying(true);
    }
  }, [isOpen, autoPlay]);

  const handleShare = () => {
    if (videoUrl) {
      navigator.clipboard.writeText(videoUrl);
      toast.success('Video link copied to clipboard!');
    }
  };

  const handleDownload = () => {
    if (videoUrl) {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = `${episodeTitle.replace(/\s+/g, '_')}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started!');
    }
  };

  const handleFullscreen = () => {
    const videoElement = document.querySelector('video');
    if (videoElement) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoElement.requestFullscreen();
      }
    }
  };

  if (!videoUrl) return null;

  const episodeInfo = season && episodeNumber 
    ? `S${season}E${episodeNumber} - ${episodeTitle}` 
    : episodeTitle;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-bold">
            🎬 {episodeInfo}
          </DialogTitle>
        </DialogHeader>
        
        <div 
          className="relative bg-black group"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          {videoUrl.endsWith('.json') ? (
            <VideoManifestPlayer
              manifestUrl={videoUrl}
              className="w-full aspect-video"
            />
          ) : (
            <video
              src={videoUrl}
              controls={showControls}
              autoPlay={autoPlay}
              muted={isMuted}
              className="w-full aspect-video"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          )}

          {/* Custom Controls Overlay */}
          <div 
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={() => {
                    const video = document.querySelector('video');
                    if (video) {
                      if (isPlaying) {
                        video.pause();
                      } else {
                        video.play();
                      }
                    }
                  }}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={() => {
                    setIsMuted(!isMuted);
                    const video = document.querySelector('video');
                    if (video) {
                      video.muted = !isMuted;
                    }
                  }}
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={handleDownload}
                >
                  <Download className="h-5 w-5" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={handleFullscreen}
                >
                  <Maximize className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 pt-4 bg-card">
          <p className="text-sm text-muted-foreground">
            Your episode has been generated and is ready to watch! Use the controls to play, share, or download.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
