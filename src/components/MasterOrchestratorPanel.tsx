import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, PlayCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MasterOrchestratorPanelProps {
  episodeId?: string;
  projectId?: string;
}

export const MasterOrchestratorPanel = ({ episodeId, projectId }: MasterOrchestratorPanelProps) => {
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runOrchestration = async (task: string) => {
    if (!projectId) {
      toast({
        title: "Missing Context",
        description: "Please select a project first",
        variant: "destructive",
      });
      return;
    }

    setRunning(true);
    setResults(null);

    try {
      // Map tasks to workflow parameters
      const workflowParams: Record<string, { style?: string; duration?: number }> = {
        'full_production': { style: 'cinematic', duration: 60 },
        'music_production': { style: 'dramatic', duration: 30 },
        'video_enhancement': { style: 'polished', duration: 45 },
        'viral_optimization': { style: 'trendy', duration: 30 },
      };

      const params = workflowParams[task] || { style: 'cinematic', duration: 60 };

      const { data, error } = await supabase.functions.invoke('director-workflow', {
        body: {
          projectId,
          prompt: `Execute ${task.replace('_', ' ')} workflow`,
          ...params,
        },
      });

      if (error) throw error;

      setResults(data);
      
      toast({
        title: "🎬 Production Complete",
        description: `Workflow executed successfully - Episode ${data.episodeId}`,
      });

    } catch (error) {
      console.error('Workflow error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to run workflow',
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  };

  const tasks = [
    {
      id: 'full_production',
      name: 'Full Production Pipeline',
      description: 'Complete end-to-end production with all bots coordinated',
      icon: Sparkles,
      bots: '20+ bots',
      time: '15-30 min',
    },
    {
      id: 'music_production',
      name: 'Music Production',
      description: 'Suno music generation + audio mixing + voice + effects',
      icon: Sparkles,
      bots: '4 bots',
      time: '5-10 min',
    },
    {
      id: 'video_enhancement',
      name: 'Video Enhancement',
      description: 'All 5 Artlist modes + color grading + smart editing',
      icon: Sparkles,
      bots: '5 bots',
      time: '10-15 min',
    },
    {
      id: 'viral_optimization',
      name: 'Viral Optimization',
      description: 'Trend detection + hook optimization + content optimization',
      icon: Sparkles,
      bots: '6 bots',
      time: '8-12 min',
    },
  ];

  return (
    <Card className="border-2 border-primary/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          <CardTitle>Master Orchestrator</CardTitle>
        </div>
        <CardDescription>
          AI-powered coordination of all production bots - Director, Artlist, Suno, and more
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task) => {
            const Icon = task.icon;
            return (
              <Card key={task.id} className="border-muted hover:border-primary transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-primary" />
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">{task.bots}</Badge>
                      <Badge variant="outline" className="text-xs">{task.time}</Badge>
                    </div>
                  </div>
                  <CardTitle className="text-base">{task.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {task.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => runOrchestration(task.id)}
                    disabled={running}
                    className="w-full"
                    size="sm"
                  >
                    {running ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Orchestrating...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="mr-2 h-3 w-3" />
                        Run Pipeline
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {results && (
          <Card className="mt-6 bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm">Production Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Episode ID:</span> {results.episodeId}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Status:</span> {results.workflowStatus}
                  </div>
                  {results.manifestUrl && (
                    <div className="text-sm">
                      <span className="font-medium">Video Manifest:</span>{' '}
                      <a href={results.manifestUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        View
                      </a>
                    </div>
                  )}
                  {results.videoUrl && (
                    <div className="text-sm">
                      <span className="font-medium">Video URL:</span>{' '}
                      <a href={results.videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Watch
                      </a>
                    </div>
                  )}
                </div>

                {results.workflow && (
                  <div className="border-t pt-3">
                    <h4 className="font-semibold text-sm mb-2">Workflow Pipeline</h4>
                    <div className="space-y-1">
                      {Object.entries(results.workflow).map(([step, status]) => (
                        <div key={step} className="flex items-center justify-between text-xs">
                          <span className="capitalize">{step.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <Badge variant={status.toString().startsWith('✅') ? 'default' : 'secondary'} className="text-xs">
                            {status as string}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.episode?.metadata?.processing?.godLevelBots && (
                  <div className="border-t pt-3">
                    <h4 className="font-semibold text-sm mb-2">🎥 God-Level FFmpeg Bots</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {results.episode.metadata.processing.godLevelBots.map((bot: string) => (
                        <Badge key={bot} variant="outline" className="text-xs justify-start">
                          {bot.replace(/-/g, ' ').replace(/bot/g, '').trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium hover:text-primary">
                    View Detailed Results
                  </summary>
                  <pre className="text-xs overflow-auto max-h-96 bg-background p-3 rounded-md mt-2">
                    {JSON.stringify(results, null, 2)}
                  </pre>
                </details>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};
