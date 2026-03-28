import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface VideoGenerationProgressProps {
  episodeId: string;
  onComplete?: (videoUrl: string) => void;
}

const PHASES = [
  { num: 1, icon: '🤖', name: 'AI Scene Analysis', desc: 'Analyzing script and generating scene breakdown' },
  { num: 2, icon: '🎨', name: 'Image Generation', desc: 'Creating photorealistic AI scene images' },
  { num: 3, icon: '📤', name: 'Asset Upload', desc: 'Uploading frames to storage' },
  { num: 4, icon: '✅', name: 'Manifest Creation', desc: 'Building video manifest for client-side compilation' },
];

export function VideoGenerationProgress({ episodeId, onComplete }: VideoGenerationProgressProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Poll episode status
    const poll = setInterval(async () => {
      const { data } = await supabase
        .from('episodes')
        .select('video_status, video_url')
        .eq('id', episodeId)
        .single();

      if (!data) return;

      if (data.video_status === 'processing') setCurrentPhase(1);
      else if (data.video_status === 'rendering') setCurrentPhase(2);
      else if (data.video_status === 'completed') {
        setCurrentPhase(4);
        setIsComplete(true);
        clearInterval(poll);
        if (data.video_url) onComplete?.(data.video_url);
      } else if (data.video_status === 'failed') {
        clearInterval(poll);
      }
    }, 3000);

    return () => clearInterval(poll);
  }, [episodeId, onComplete]);

  const progressPercentage = isComplete ? 100 : (currentPhase / PHASES.length) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isComplete ? (
              <><CheckCircle2 className="h-5 w-5 text-green-500" />Scenes Generated</>
            ) : (
              <><Loader2 className="h-5 w-5 animate-spin" />Generating Scenes</>
            )}
          </CardTitle>
          <Badge variant={isComplete ? 'default' : 'secondary'}>
            Phase {currentPhase || 1} of {PHASES.length}
          </Badge>
        </div>
        <CardDescription>
          {isComplete
            ? '✅ AI scenes ready — compile to MP4 in the video player'
            : 'Generating photorealistic AI scene images...'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progressPercentage} className="h-2" />
        <div className="space-y-2">
          {PHASES.map((phase) => {
            const isActive = currentPhase === phase.num;
            const isDone = currentPhase > phase.num || isComplete;
            return (
              <div
                key={phase.num}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  isActive ? 'border-primary bg-primary/5'
                  : isDone ? 'border-green-500/20 bg-green-500/5'
                  : 'border-border bg-muted/30'
                }`}
              >
                <div className="text-xl flex-shrink-0">
                  {isDone ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                  : isActive ? <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  : <span className="opacity-50">{phase.icon}</span>}
                </div>
                <div>
                  <p className={`text-sm font-medium ${isActive || isDone ? '' : 'text-muted-foreground'}`}>
                    {phase.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{phase.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
