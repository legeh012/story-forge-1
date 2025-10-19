import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Video, Play, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Episode {
  id: string;
  title: string;
  synopsis: string;
  video_status: string;
  video_url: string | null;
  video_render_error: string | null;
}

interface VideoRendererProps {
  episode: Episode;
  onStatusChange?: () => void;
}

export const VideoRenderer = ({ episode, onStatusChange }: VideoRendererProps) => {
  const [isRendering, setIsRendering] = useState(false);
  const { toast } = useToast();

  const startRender = async () => {
    setIsRendering(true);
    
    try {
      toast({
        title: 'Starting video render',
        description: 'Generating scenes and images...',
      });

      const { data, error } = await supabase.functions.invoke('render-episode-video', {
        body: { episodeId: episode.id },
      });

      if (error) throw error;

      toast({
        title: 'Video rendered!',
        description: data.message || 'Your episode video is ready',
      });

      onStatusChange?.();
    } catch (error) {
      console.error('Render error:', error);
      toast({
        title: 'Render failed',
        description: error instanceof Error ? error.message : 'Failed to render video',
        variant: 'destructive',
      });
    } finally {
      setIsRendering(false);
    }
  };

  const getStatusBadge = () => {
    switch (episode.video_status) {
      case 'completed':
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'rendering':
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Rendering
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Video className="h-3 w-3 mr-1" />
            Not Started
          </Badge>
        );
    }
  };

  const viewVideo = async () => {
    if (!episode.video_url) return;

    try {
      const { data } = await supabase.storage
        .from('episode-videos')
        .download(`${episode.id}/metadata.json`);

      if (data) {
        const text = await data.text();
        const metadata = JSON.parse(text);
        
        toast({
          title: 'Video Metadata',
          description: `${metadata.scenes.length} scenes, ${metadata.totalDuration}s duration`,
        });
      }
    } catch (error) {
      console.error('Error viewing video:', error);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Video className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{episode.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {episode.synopsis}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {episode.video_status === 'rendering' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Generating scenes...</span>
              <span className="text-primary">In progress</span>
            </div>
            <Progress value={60} className="h-2" />
          </div>
        )}

        {episode.video_render_error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{episode.video_render_error}</p>
          </div>
        )}

        <div className="flex gap-2">
          {episode.video_status === 'not_started' && (
            <Button
              onClick={startRender}
              disabled={isRendering}
              className="w-full bg-gradient-to-r from-accent to-primary"
            >
              {isRendering ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rendering...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Render Video
                </>
              )}
            </Button>
          )}

          {episode.video_status === 'completed' && (
            <Button
              onClick={viewVideo}
              variant="outline"
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              View Video Details
            </Button>
          )}

          {episode.video_status === 'failed' && (
            <Button
              onClick={startRender}
              disabled={isRendering}
              variant="outline"
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              Retry Render
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
