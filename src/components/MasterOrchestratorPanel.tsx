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
    if (!episodeId && !projectId) {
      toast({
        title: "Missing Context",
        description: "Please select an episode or project first",
        variant: "destructive",
      });
      return;
    }

    setRunning(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('master-orchestrator', {
        body: {
          task,
          episodeId,
          projectId,
        },
      });

      if (error) throw error;

      setResults(data);
      
      toast({
        title: "🎬 Orchestration Complete",
        description: `${data.results.length} bots coordinated successfully`,
      });

    } catch (error) {
      console.error('Orchestration error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to run orchestration',
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
              <CardTitle className="text-sm">Orchestration Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Task:</span> {results.task}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Bots Executed:</span> {results.results.length}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Reasoning:</span> {results.orchestrationPlan.reasoning}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Estimated Time:</span> {results.orchestrationPlan.estimatedTime}
                </div>
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
