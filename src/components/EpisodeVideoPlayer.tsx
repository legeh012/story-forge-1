import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, ExternalLink } from 'lucide-react';
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

// Extract YouTube video ID from various YouTube URL formats
const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/  // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
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
  autoPlay = false
}: EpisodeVideoPlayerProps) {
  if (!videoUrl) return null;

  const episodeInfo = season && episodeNumber 
    ? `S${season}E${episodeNumber} - ${episodeTitle}` 
    : episodeTitle;

  const youtubeId = extractYouTubeId(videoUrl);
  const embedUrl = youtubeId 
    ? `https://www.youtube.com/embed/${youtubeId}${autoPlay ? '?autoplay=1' : ''}`
    : null;

  const handleShare = () => {
    if (videoUrl) {
      navigator.clipboard.writeText(videoUrl);
      toast.success('Video link copied to clipboard!');
    }
  };

  const handleOpenYouTube = () => {
    if (videoUrl) {
      window.open(videoUrl, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-bold">
            🎬 {episodeInfo}
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative bg-black">
          {embedUrl ? (
            <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
              <iframe
                src={embedUrl}
                title={episodeInfo}
                className="absolute top-0 left-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="aspect-video flex items-center justify-center bg-muted text-muted-foreground">
              <p>Invalid YouTube URL</p>
            </div>
          )}
        </div>

        <div className="p-6 pt-4 bg-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Your episode is ready to watch on YouTube!
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button
                size="sm"
                onClick={handleOpenYouTube}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in YouTube
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
