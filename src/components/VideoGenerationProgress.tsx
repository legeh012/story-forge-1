import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface ProgressData {
  current_phase: number;
  total_phases: number;
  phase_name: string;
  phase_status: string;
  phase_details: any;
  updated_at: string;
}

interface VideoGenerationProgressProps {
  episodeId: string;
  onComplete?: (videoUrl: string) => void;
}

const phaseIcons = {
  1: '🎬',
  2: '🤖',
  3: '🎨',
  4: '🖼️',
  5: '🎨',
  6: '⬆️',
  7: '✨',
  8: '🔊',
  9: '🎵'
};

const phaseDescriptions = {
  1: 'VMaker Video Composition - Stabilizing and smoothing motion',
  2: 'Bing AI Optimization - AI-powered upscaling and enhancement',
  3: 'Scene Composition - Cinema-grade transitions and compositing',
  4: 'Frame Optimization - Enhancing details and removing artifacts',
  5: 'Color Grading - Premium VH1/BET color treatment',
  6: 'Quality Enhancement - Broadcast-quality video processing',
  7: 'Visual Effects - Professional motion graphics and overlays',
  8: 'Audio Synchronization - Frame-perfect audio sync',
  9: 'Audio Mastering - Professional audio mastering'
};

export function VideoGenerationProgress({ episodeId, onComplete }: VideoGenerationProgressProps) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [allPhases, setAllPhases] = useState<ProgressData[]>([]);

  useEffect(() => {
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`progress-${episodeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'video_generation_progress',
          filter: `episode_id=eq.${episodeId}`
        },
        (payload) => {
          const newProgress = payload.new as ProgressData;
          setProgress(newProgress);
          setAllPhases(prev => [...prev, newProgress]);
          
          // Check if complete
          if (newProgress.phase_status === 'completed' && newProgress.phase_details?.videoUrl) {
            onComplete?.(newProgress.phase_details.videoUrl);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [episodeId, onComplete]);

  if (!progress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Initializing Video Generation
          </CardTitle>
          <CardDescription>
            Preparing to process your video with 9 AI-powered phases
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const progressPercentage = (progress.current_phase / progress.total_phases) * 100;
  const isComplete = progress.phase_status === 'completed';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isComplete ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Video Generation Complete
              </>
            ) : (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing Video
              </>
            )}
          </CardTitle>
          <Badge variant={isComplete ? 'default' : 'secondary'}>
            Phase {progress.current_phase} of {progress.total_phases}
          </Badge>
        </div>
        <CardDescription>
          {isComplete
            ? 'All phases completed successfully'
            : progress.phase_details?.status || 'Processing...'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{progress.phase_name}</span>
            <span className="text-muted-foreground">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Processing Phases</h4>
          <div className="space-y-2">
            {Array.from({ length: 9 }, (_, i) => i + 1).map((phaseNum) => {
              const phaseData = allPhases.find(p => p.current_phase === phaseNum);
              const isActive = progress.current_phase === phaseNum;
              const isCompleted = phaseData && progress.current_phase > phaseNum;
              
              return (
                <div
                  key={phaseNum}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    isActive
                      ? 'border-primary bg-primary/5'
                      : isCompleted
                      ? 'border-green-500/20 bg-green-500/5'
                      : 'border-border bg-muted/30'
                  }`}
                >
                  <div className="text-2xl flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : isActive ? (
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : (
                      <span className="opacity-50">{phaseIcons[phaseNum as keyof typeof phaseIcons]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${isActive || isCompleted ? '' : 'text-muted-foreground'}`}>
                        Phase {phaseNum}
                      </p>
                      {isActive && (
                        <Badge variant="outline" className="text-xs">
                          In Progress
                        </Badge>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {phaseDescriptions[phaseNum as keyof typeof phaseDescriptions]}
                    </p>
                    {phaseData?.phase_details?.status && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {phaseData.phase_details.status}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {isComplete && progress.phase_details?.processingTime && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Total processing time: {(progress.phase_details.processingTime / 1000).toFixed(2)}s
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
