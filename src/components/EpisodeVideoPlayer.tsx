import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, ExternalLink, Video, Film } from 'lucide-react';
import { toast } from 'sonner';
import { FFmpegVideoRenderer } from './FFmpegVideoRenderer';
import { VideoManifestPlayer } from './VideoManifestPlayer';

interface EpisodeVideoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string | null;
  episodeTitle?: string;
  episodeNumber?: number;
  season?: number;
  autoPlay?: boolean;
}

const isYouTubeUrl = (url: string): boolean => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};

const isManifestUrl = (url: string): boolean => {
  return url.includes('manifest') || url.includes('metadata.json') || url.endsWith('.json');
};

const isDirectVideo = (url: string): boolean => {
  return url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov');
};

const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\s?]+)/,
    /(?:youtu\.be\/)([^&\s?]+)/,
    /(?:youtube\.com\/embed\/)([^&\s?]+)/,
    /(?:youtube\.com\/shorts\/)([^&\s?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
};

export function EpisodeVideoPlayer({
  isOpen,
  onClose,
  videoUrl,
  episodeTitle = 'Episode',
  episodeNumber,
  season,
  autoPlay = false,
}: EpisodeVideoPlayerProps) {
  if (!videoUrl) return null;

  const episodeInfo = season && episodeNumber
    ? `S${season}E${episodeNumber} - ${episodeTitle}`
    : episodeTitle;

  const handleShare = () => {
    navigator.clipboard.writeText(videoUrl);
    toast.success('Video link copied to clipboard!');
  };

  const youtubeId = isYouTubeUrl(videoUrl) ? extractYouTubeId(videoUrl) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-bold">🎬 {episodeInfo}</DialogTitle>
        </DialogHeader>

        <div className="relative bg-black">
          {youtubeId ? (
            /* YouTube embed */
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}${autoPlay ? '?autoplay=1' : ''}`}
                title={episodeInfo}
                className="absolute top-0 left-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : isDirectVideo(videoUrl) ? (
            /* Direct MP4/WebM */
            <div className="aspect-video">
              <video src={videoUrl} controls autoPlay={autoPlay} className="w-full h-full" />
            </div>
          ) : isManifestUrl(videoUrl) ? (
            /* Manifest: show slideshow player + offer FFmpeg compile */
            <div className="space-y-0">
              <VideoManifestPlayer manifestUrl={videoUrl} className="aspect-video" />
              <div className="p-4 bg-card border-t">
                <FFmpegVideoRenderer manifestUrl={videoUrl} episodeTitle={episodeTitle} />
              </div>
            </div>
          ) : (
            /* Fallback: try as video */
            <div className="aspect-video flex flex-col items-center justify-center bg-muted text-muted-foreground p-8">
              <Video className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-semibold mb-2">Video Available</p>
              <Button variant="outline" onClick={() => window.open(videoUrl, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />Open Video
              </Button>
            </div>
          )}
        </div>

        <div className="p-6 pt-4 bg-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isManifestUrl(videoUrl)
                ? 'AI scenes generated — compile to MP4 using the render button above'
                : 'Your episode is ready to watch!'}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />Share
              </Button>
              {isYouTubeUrl(videoUrl) && (
                <Button size="sm" onClick={() => window.open(videoUrl, '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" />Open in YouTube
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
