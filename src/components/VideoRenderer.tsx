import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Video, Play, Loader2, AlertCircle, CheckCircle2, Camera, Sparkles, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Episode {
  id: string;
  title: string;
  synopsis: string;
  video_status: string;
  video_url: string | null;
  video_render_error: string | null;
  rendering_style: string;
  realism_settings: {
    anatomical_accuracy: boolean;
    realistic_lighting: boolean;
    no_cartoon_filters: boolean;
    natural_expressions: boolean;
    finger_count_validation: boolean;
    netflix_grade: boolean;
  };
}

interface VideoRendererProps {
  episode: Episode;
  onStatusChange?: () => void;
}

export const VideoRenderer = ({ episode, onStatusChange }: VideoRendererProps) => {
  const [isRendering, setIsRendering] = useState(false);
  const [isPhotorealistic, setIsPhotorealistic] = useState(
    episode.rendering_style === 'photorealistic'
  );
  const { toast } = useToast();

  const toggleRenderingStyle = async (photorealistic: boolean) => {
    try {
      const { error } = await supabase
        .from('episodes')
        .update({
          rendering_style: photorealistic ? 'photorealistic' : 'stylized'
        })
        .eq('id', episode.id);

      if (error) throw error;

      setIsPhotorealistic(photorealistic);
      toast({
        title: 'Rendering style updated',
        description: `Set to ${photorealistic ? 'Netflix-grade Photorealistic' : 'Stylized'} mode`,
      });

      onStatusChange?.();
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Could not change rendering style',
        variant: 'destructive',
      });
    }
  };

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

  const downloadClips = async () => {
    if (!episode.video_url) {
      toast({
        title: 'No clips available',
        description: 'Video rendering not completed yet',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('Downloading clips for episode:', episode.id);
      
      // Get user ID from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data, error: downloadError } = await supabase.storage
        .from('episode-videos')
        .download(`${user.id}/${episode.id}/metadata.json`);

      if (downloadError) {
        console.error('Metadata download error:', downloadError);
        throw downloadError;
      }

      if (data) {
        const text = await data.text();
        const metadata = JSON.parse(text);
        
        console.log('Clip metadata:', metadata);
        
        // Handle both 'clips' and 'scenes' formats
        const items = metadata.clips || metadata.scenes || [];
        
        if (items.length > 0) {
          toast({
            title: 'Starting download',
            description: `Downloading ${items.length} frames from ${episode.title}`,
          });

          // Download each frame
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            // Handle both clip and scene formats
            const frameUrl = item.downloadUrl || item.frameUrl || 
                           `https://akmeovotnnqbxotlerie.supabase.co/storage/v1/object/public/episode-videos/${user.id}/${episode.id}/frame_${String(item.frameIndex || i).padStart(4, '0')}.png`;
            
            const link = document.createElement('a');
            link.href = frameUrl;
            link.download = `${episode.title.replace(/[^a-z0-9]/gi, '_')}_frame_${String(i + 1).padStart(2, '0')}.png`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Small delay between downloads
            await new Promise(resolve => setTimeout(resolve, 800));
          }

          toast({
            title: 'Download complete',
            description: `${items.length} frames downloaded successfully`,
          });
        } else {
          throw new Error('No frames found in metadata');
        }
      } else {
        throw new Error('Failed to retrieve metadata');
      }
    } catch (error) {
      console.error('Clip download error:', error);
      toast({
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'Could not download video clips',
        variant: 'destructive',
      });
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
        {/* Realism Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2">
            {isPhotorealistic ? (
              <Camera className="h-4 w-4 text-primary" />
            ) : (
              <Sparkles className="h-4 w-4 text-accent" />
            )}
            <div>
              <Label htmlFor="realism-toggle" className="text-sm font-medium cursor-pointer">
                {isPhotorealistic ? 'Netflix-Grade Photorealistic' : 'Stylized'}
              </Label>
              <p className="text-xs text-muted-foreground">
                {isPhotorealistic 
                  ? 'Anatomical accuracy, realistic lighting, no cartoon filters'
                  : 'Artistic styling with creative freedom'
                }
              </p>
            </div>
          </div>
          <Switch
            id="realism-toggle"
            checked={isPhotorealistic}
            onCheckedChange={toggleRenderingStyle}
            disabled={episode.video_status === 'rendering'}
          />
        </div>

        {/* Quality Indicators */}
        {isPhotorealistic && (
          <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
            <div className="flex items-center gap-2 text-xs text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              <span>5-Finger Accuracy</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              <span>Realistic Lighting</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              <span>No Cartoon Filters</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              <span>Natural Expressions</span>
            </div>
          </div>
        )}

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
              onClick={downloadClips}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Clips
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
