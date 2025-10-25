import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Sparkles, Video, Wand2, Zap } from 'lucide-react';

interface LoadingPhase {
  label: string;
  icon: React.ReactNode;
  duration: number;
}

interface SmartLoadingStateProps {
  operation: 'generating-episode' | 'rendering-video' | 'processing-ai' | 'saving-data';
  message?: string;
  progress?: number;
}

const operationPhases: Record<string, LoadingPhase[]> = {
  'generating-episode': [
    { label: 'Analyzing your prompt', icon: <Sparkles className="h-4 w-4" />, duration: 2000 },
    { label: 'Creating story structure', icon: <Wand2 className="h-4 w-4" />, duration: 3000 },
    { label: 'Writing dialogue and scenes', icon: <Wand2 className="h-4 w-4" />, duration: 4000 },
    { label: 'Optimizing for viral impact', icon: <Zap className="h-4 w-4" />, duration: 2000 },
  ],
  'rendering-video': [
    { label: 'Generating photorealistic scenes', icon: <Video className="h-4 w-4" />, duration: 5000 },
    { label: 'Applying cinematic effects', icon: <Sparkles className="h-4 w-4" />, duration: 4000 },
    { label: 'Compiling video frames', icon: <Video className="h-4 w-4" />, duration: 6000 },
    { label: 'Finalizing output', icon: <Zap className="h-4 w-4" />, duration: 3000 },
  ],
  'processing-ai': [
    { label: 'Connecting to AI models', icon: <Loader2 className="h-4 w-4" />, duration: 1500 },
    { label: 'Processing request', icon: <Sparkles className="h-4 w-4" />, duration: 3000 },
    { label: 'Generating response', icon: <Wand2 className="h-4 w-4" />, duration: 2500 },
  ],
  'saving-data': [
    { label: 'Preparing data', icon: <Loader2 className="h-4 w-4" />, duration: 1000 },
    { label: 'Saving to database', icon: <Zap className="h-4 w-4" />, duration: 2000 },
  ],
};

export const SmartLoadingState = ({ 
  operation, 
  message,
  progress: externalProgress 
}: SmartLoadingStateProps) => {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [internalProgress, setInternalProgress] = useState(0);
  const phases = operationPhases[operation] || operationPhases['processing-ai'];

  useEffect(() => {
    if (externalProgress !== undefined) {
      setInternalProgress(externalProgress);
      return;
    }

    const totalDuration = phases.reduce((sum, phase) => sum + phase.duration, 0);
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += 100;
      const progressPercent = Math.min((elapsed / totalDuration) * 100, 95);
      setInternalProgress(progressPercent);

      let accumulatedDuration = 0;
      for (let i = 0; i < phases.length; i++) {
        accumulatedDuration += phases[i].duration;
        if (elapsed < accumulatedDuration) {
          setCurrentPhaseIndex(i);
          break;
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [operation, phases, externalProgress]);

  const currentPhase = phases[currentPhaseIndex];

  return (
    <Card className="p-6 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20 animate-pulse">
            {currentPhase.icon}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{currentPhase.label}</p>
            {message && (
              <p className="text-xs text-muted-foreground">{message}</p>
            )}
          </div>
        </div>

        <Progress value={internalProgress} className="h-2" />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Phase {currentPhaseIndex + 1} of {phases.length}</span>
          <span>{Math.round(internalProgress)}%</span>
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            ✨ Creating production-grade content with AI...
          </p>
        </div>
      </div>
    </Card>
  );
};
