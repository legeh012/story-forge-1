import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Film, Loader2, CheckCircle, PlayCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WorkflowStatus {
  script?: string;
  music?: string;
  scenes?: string;
  voiceovers?: string;
  images?: string;
  ffmpegProcessing?: string;
  manifest?: string;
}

export const DirectorPanel = () => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<'dramatic' | 'comedic' | 'tense' | 'romantic'>('dramatic');
  const [duration, setDuration] = useState('30');
  const [isProducing, setIsProducing] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>({});
  const [episodeUrl, setEpisodeUrl] = useState<string | null>(null);

  const startProduction = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsProducing(true);
    setWorkflowStatus({});
    setEpisodeUrl(null);

    try {
      // Get user's project
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (!projects || projects.length === 0) {
        throw new Error('No project found. Please create a project first.');
      }

      const projectId = projects[0].id;

      toast.info('🎬 Director is orchestrating production...');

      // Invoke director workflow
      const { data, error } = await supabase.functions.invoke('director-workflow', {
        body: {
          projectId: projectId,
          prompt: prompt,
          style: style,
          duration: parseInt(duration)
        }
      });

      if (error) throw error;

      if (data.success) {
        setWorkflowStatus(data.workflow);
        setEpisodeUrl(`/episodes/${data.episode.id}`);
        
        toast.success('🎉 Production complete!', {
          description: 'Your episode is ready to render'
        });
      } else {
        throw new Error('Production failed');
      }

    } catch (error) {
      console.error('Production error:', error);
      toast.error('Production failed: ' + error.message);
    } finally {
      setIsProducing(false);
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    if (!status) return null;
    if (status.startsWith('✅')) return <CheckCircle className="w-4 h-4 text-success" />;
    return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Film className="w-5 h-5" />
          Director's Orchestration
        </CardTitle>
        <CardDescription>
          AI Director orchestrates all production bots: Script → Music → Visuals → Voice → Assembly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Episode Concept</label>
          <Textarea
            placeholder="Lucky and Luul get into a heated argument at the rooftop party about who's the real star..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-24"
            disabled={isProducing}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Style</label>
            <Select value={style} onValueChange={(v: any) => setStyle(v)} disabled={isProducing}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dramatic">🎭 Dramatic</SelectItem>
                <SelectItem value="comedic">😂 Comedic</SelectItem>
                <SelectItem value="tense">😰 Tense</SelectItem>
                <SelectItem value="romantic">💕 Romantic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Duration (seconds)</label>
            <Select value={duration} onValueChange={setDuration} disabled={isProducing}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15s (3 scenes)</SelectItem>
                <SelectItem value="30">30s (6 scenes)</SelectItem>
                <SelectItem value="60">60s (12 scenes)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {Object.keys(workflowStatus).length > 0 && (
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Production Pipeline</h4>
            {Object.entries(workflowStatus).map(([step, status]) => (
              <div key={step} className="flex items-center justify-between text-sm">
                <span className="capitalize">{step}</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(status)}
                  <Badge variant="outline" className="text-xs">
                    {status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={startProduction} 
            disabled={isProducing || !prompt.trim()}
            className="flex-1"
            size="lg"
          >
            {isProducing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Directing Production...
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4 mr-2" />
                Start Production
              </>
            )}
          </Button>

          {episodeUrl && (
            <Button 
              onClick={() => window.location.href = episodeUrl}
              variant="outline"
              size="lg"
            >
              View Episode
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>🎬 <strong>Director Workflow:</strong></p>
          <p>1. Turbo Script Bot generates the script</p>
          <p>2. Suno Music Generator composes background music</p>
          <p>3. Scene Orchestration creates visual descriptions</p>
          <p>4. Godlike Voice Bot narrates character dialogue</p>
          <p>5. AI Image Generator creates photorealistic frames</p>
          <p>6. God-Level FFmpeg Compiler processes video (Scene Composer, Frame Optimizer, Color Grader, Quality Enhancer, Effects, Audio Sync & Master)</p>
          <p>7. Final video manifest assembly</p>
        </div>
      </CardContent>
    </Card>
  );
};
