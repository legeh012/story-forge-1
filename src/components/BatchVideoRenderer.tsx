import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Film, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface BatchRenderResult {
  episodeNumber: number;
  title: string;
  status: string;
  videoUrl?: string;
  error?: string;
  processingTime?: string;
}

export const BatchVideoRenderer = () => {
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BatchRenderResult[]>([]);
  const [totalTime, setTotalTime] = useState('');

  const startBatchRender = async () => {
    setIsRendering(true);
    setProgress(0);
    setResults([]);
    
    try {
      // Verify authentication first
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        throw new Error('Authentication required. Please log in again.');
      }

      toast.info('🎬 Starting batch video rendering...', {
        description: 'Processing all episodes with premium settings'
      });

      const { data, error } = await supabase.functions.invoke('batch-video-renderer', {
        body: {
          episode_manifests: [
            'episode01.json', 'episode02.json', 'episode03.json', 'episode04.json', 'episode05.json',
            'episode06.json', 'episode07.json', 'episode08.json', 'episode09.json', 'episode10.json',
            'episode11.json', 'episode12.json', 'episode13.json', 'reunion_part1.json', 'reunion_part2.json'
          ],
          settings: {
            frame_rate: 24,
            resolution: '1080p',
            audio_file: 'Suno_djluckluck.mp3',
            transitions: ['fade', 'slide'],
            output_format: '.mp4',
            audio_instructions: 'Use Suno by @djluckluck throughout all episodes, loop if necessary, keep narration and dialogue clear'
          },
          output_paths: [
            'output_episode01.mp4', 'output_episode02.mp4', 'output_episode03.mp4', 'output_episode04.mp4', 'output_episode05.mp4',
            'output_episode06.mp4', 'output_episode07.mp4', 'output_episode08.mp4', 'output_episode09.mp4', 'output_episode10.mp4',
            'output_episode11.mp4', 'output_episode12.mp4', 'output_episode13.mp4', 'output_reunion_part1.mp4', 'output_reunion_part2.mp4'
          ]
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        
        // Check if it's a network error
        if (error.message?.includes('Failed to send') || error.message?.includes('Load failed')) {
          throw new Error('Network error: Unable to reach video rendering service. Please check your connection and try again.');
        }
        
        throw error;
      }

      setResults(data.results);
      setTotalTime(data.totalProcessingTime);
      setProgress(100);

      toast.success(`🎉 Batch rendering complete!`, {
        description: `${data.successCount}/${data.totalEpisodes} episodes rendered in ${data.totalProcessingTime}`
      });

    } catch (error) {
      console.error('Batch rendering error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast.error('Failed to render videos', {
        description: errorMessage,
        duration: 10000
      });
    } finally {
      setIsRendering(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge className="bg-blue-500">Processing</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Film className="w-6 h-6" />
          Batch Video Renderer
        </CardTitle>
        <CardDescription>
          Render all 15 episodes with premium VH1/Netflix quality settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Render Settings</p>
              <p className="text-xs text-muted-foreground">
                1080p @ 24fps • Suno by @djluckluck • Fade/Slide transitions
              </p>
            </div>
            <Button
              onClick={startBatchRender}
              disabled={isRendering}
              size="lg"
            >
              {isRendering ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rendering...
                </>
              ) : (
                <>
                  <Film className="w-4 h-4 mr-2" />
                  Start Batch Render
                </>
              )}
            </Button>
          </div>

          {isRendering && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Overall Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {totalTime && (
            <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Total Processing Time</p>
                <p className="text-xs text-muted-foreground">{totalTime}</p>
              </div>
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Rendering Results</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {results.map((result) => (
                <div
                  key={result.episodeNumber}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Episode {result.episodeNumber}: {result.title}
                      </p>
                      {result.error && (
                        <p className="text-xs text-red-500 mt-1">{result.error}</p>
                      )}
                      {result.processingTime && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Processed in {result.processingTime}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(result.status)}
                    {result.videoUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(result.videoUrl, '_blank')}
                      >
                        View
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t space-y-2">
          <h4 className="text-sm font-semibold">Batch Processing Details</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Episodes processed in batches of 3 for optimal performance</li>
            <li>• All 7 god-level FFmpeg bots active per episode</li>
            <li>• Professional color grading, effects, and audio mastering</li>
            <li>• Suno by @djluckluck music integrated throughout</li>
            <li>• VH1/Netflix premium quality output</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
