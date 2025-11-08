import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, Mic, Image, Video, Download, Share2, 
  CheckCircle2, Clock, AlertCircle, Loader2, Play, Sparkles
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { Progress } from "@/components/ui/progress";

interface WorkflowStage {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  action?: () => void;
  actionLabel?: string;
}

interface EpisodeWorkflowPipelineProps {
  episodeId: string;
  episodeTitle: string;
  episodeStatus: string;
  videoStatus?: string;
  script?: string;
  voiceGenerated?: boolean;
  scenesGenerated?: boolean;
  videoUrl?: string;
  onGenerateScript?: () => void;
  onGenerateVoice?: () => void;
  onGenerateScenes?: () => void;
  onStartRender?: () => void;
  onDownload?: () => void;
  onPublish?: () => void;
}

export const EpisodeWorkflowPipeline = ({
  episodeId,
  episodeTitle,
  episodeStatus,
  videoStatus = 'not_started',
  script,
  voiceGenerated,
  scenesGenerated,
  videoUrl,
  onGenerateScript,
  onGenerateVoice,
  onGenerateScenes,
  onStartRender,
  onDownload,
  onPublish
}: EpisodeWorkflowPipelineProps) => {
  const [liveProgress, setLiveProgress] = useState<any>(null);
  const [showUnifiedProgress, setShowUnifiedProgress] = useState(false);

  // Subscribe to real-time progress updates
  useEffect(() => {
    if (!episodeId) return;

    const channel = supabase
      .channel(`video-progress-${episodeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'video_generation_progress',
          filter: `episode_id=eq.${episodeId}`
        },
        (payload) => {
          console.log('📊 Progress update:', payload);
          setLiveProgress(payload.new);
          
          // Show unified processor progress when it starts
          if (payload.new.phase_name && payload.new.phase_name.includes('Phase')) {
            setShowUnifiedProgress(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [episodeId]);

  const getStageStatus = (stage: string): 'pending' | 'in_progress' | 'completed' | 'error' => {
    switch (stage) {
      case 'script':
        if (script) return 'completed';
        return episodeStatus === 'draft' ? 'pending' : 'in_progress';
      
      case 'voice':
        if (voiceGenerated) return 'completed';
        if (script) return 'pending';
        return 'pending';
      
      case 'scenes':
        if (scenesGenerated) return 'completed';
        if (voiceGenerated) return 'pending';
        return 'pending';
      
      case 'render':
        if (videoStatus === 'completed') return 'completed';
        if (videoStatus === 'rendering') return 'in_progress';
        if (videoStatus === 'failed') return 'error';
        if (scenesGenerated) return 'pending';
        return 'pending';
      
      case 'download':
        return videoUrl ? 'completed' : 'pending';
      
      case 'publish':
        return episodeStatus === 'published' ? 'completed' : 'pending';
      
      default:
        return 'pending';
    }
  };

  const stages: WorkflowStage[] = [
    {
      id: 'script',
      label: 'Script Generation',
      icon: <FileText className="h-5 w-5" />,
      status: getStageStatus('script'),
      action: onGenerateScript,
      actionLabel: 'Generate Script'
    },
    {
      id: 'voice',
      label: 'Voice AI / Actor',
      icon: <Mic className="h-5 w-5" />,
      status: getStageStatus('voice'),
      action: onGenerateVoice,
      actionLabel: 'Generate Voice'
    },
    {
      id: 'scenes',
      label: 'Scene Generation',
      icon: <Image className="h-5 w-5" />,
      status: getStageStatus('scenes'),
      action: onGenerateScenes,
      actionLabel: 'Generate Scenes'
    },
    {
      id: 'render',
      label: 'Video Rendering',
      icon: <Video className="h-5 w-5" />,
      status: getStageStatus('render'),
      action: onStartRender,
      actionLabel: 'Start Render'
    },
    {
      id: 'download',
      label: 'Download / Play',
      icon: <Download className="h-5 w-5" />,
      status: getStageStatus('download'),
      action: onDownload,
      actionLabel: 'Download'
    },
    {
      id: 'publish',
      label: 'Publish',
      icon: <Share2 className="h-5 w-5" />,
      status: getStageStatus('publish'),
      action: onPublish,
      actionLabel: 'Publish'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-500/10';
      case 'in_progress':
        return 'border-blue-500 bg-blue-500/10 animate-pulse';
      case 'error':
        return 'border-red-500 bg-red-500/10';
      default:
        return 'border-border bg-muted/50';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold">{episodeTitle}</h3>
          <p className="text-sm text-muted-foreground">Production Pipeline</p>
          
          {/* Live Processing Status */}
          {liveProgress && (
            <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-sm font-medium text-primary">
                  Live Processing: {liveProgress.phase_name}
                </span>
              </div>
              <Progress 
                value={(liveProgress.current_phase / liveProgress.total_phases) * 100} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Phase {liveProgress.current_phase} of {liveProgress.total_phases} - {liveProgress.phase_status}
              </p>
            </div>
          )}
        </div>

        {/* Pipeline Visualization */}
        <div className="relative">
          {/* Connection Lines */}
          <div className="absolute top-10 left-0 right-0 h-0.5 bg-border" 
            style={{ zIndex: 0 }} 
          />
          
          {/* Stages */}
          <div className="relative grid grid-cols-6 gap-2" style={{ zIndex: 1 }}>
            {stages.map((stage, index) => (
              <div key={stage.id} className="flex flex-col items-center">
                {/* Stage Circle */}
                <div className={`
                  relative w-20 h-20 rounded-full border-2 flex items-center justify-center
                  transition-all duration-300 bg-background
                  ${getStatusColor(stage.status)}
                `}>
                  <div className="text-center">
                    {stage.icon}
                  </div>
                  {/* Status Indicator */}
                  <div className="absolute -bottom-1 -right-1">
                    {getStatusIcon(stage.status)}
                  </div>
                </div>

                {/* Stage Label */}
                <p className="text-xs font-medium mt-3 text-center leading-tight h-8">
                  {stage.label}
                </p>

                {/* Status Badge */}
                <Badge 
                  variant={stage.status === 'completed' ? 'default' : 'secondary'}
                  className="mt-2 text-xs"
                >
                  {stage.status === 'completed' && '✓ Done'}
                  {stage.status === 'in_progress' && '⏳ Running'}
                  {stage.status === 'error' && '✗ Error'}
                  {stage.status === 'pending' && 'Pending'}
                </Badge>

                {/* Action Button */}
                {stage.action && stage.status === 'pending' && stage.actionLabel && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={stage.action}
                    className="mt-3 text-xs h-7 px-2"
                    disabled={index > 0 && stages[index - 1].status !== 'completed'}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Start
                  </Button>
                )}

                {stage.status === 'completed' && stage.action && 
                 (stage.id === 'download' || stage.id === 'publish') && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={stage.action}
                    className="mt-3 text-xs h-7 px-2"
                  >
                    {stage.actionLabel}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Overall Progress */}
        <div className="mt-8 pt-6 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-semibold">
              {stages.filter(s => s.status === 'completed').length} / {stages.length} Complete
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div 
              className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500"
              style={{ width: `${(stages.filter(s => s.status === 'completed').length / stages.length) * 100}%` }}
            />
          </div>
        </div>

        {/* 9-Phase Unified Processing Status */}
        {showUnifiedProgress && liveProgress && (
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <h4 className="font-semibold text-foreground">God-Level Unified Processor</h4>
            </div>
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(phase => (
                  <div 
                    key={phase}
                    className={`flex items-center gap-2 p-2 rounded ${
                      phase < liveProgress.current_phase 
                        ? 'bg-green-500/20 text-green-400' 
                        : phase === liveProgress.current_phase
                        ? 'bg-blue-500/20 text-blue-400 animate-pulse'
                        : 'bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    {phase < liveProgress.current_phase && <CheckCircle2 className="h-3 w-3" />}
                    {phase === liveProgress.current_phase && <Loader2 className="h-3 w-3 animate-spin" />}
                    {phase > liveProgress.current_phase && <Clock className="h-3 w-3" />}
                    <span>Phase {phase}</span>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground mt-2">
                {liveProgress.phase_details?.status || 'Processing...'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
