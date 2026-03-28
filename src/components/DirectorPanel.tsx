import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Film, Loader2, CheckCircle, PlayCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { triggerVideoGeneration, type VideoPayload } from '@/lib/videoWorkflow';
import { VideoGenerationProgress } from './VideoGenerationProgress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface CharacterPrompt {
  name: string;
  mood: string;
  overlays?: string[];
  musicTrack?: string;
  episodeId?: string;
}

interface WorkflowStatus {
  [key: string]: string;
}

export const DirectorPanel = () => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<'dramatic' | 'comedic' | 'tense' | 'romantic'>('dramatic');
  const [duration, setDuration] = useState('30');
  const [isProducing, setIsProducing] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>({});
  const [episodeUrl, setEpisodeUrl] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [characters, setCharacters] = useState<any[]>([]);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [showProgress, setShowProgress] = useState(false);
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(null);

  useEffect(() => {
    loadCharactersAndEpisodes();
  }, []);

  const loadCharactersAndEpisodes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [charData, episodeData] = await Promise.all([
        supabase.from('characters').select('*').eq('user_id', user.id),
        supabase.from('episodes').select('*').eq('user_id', user.id).order('episode_number')
      ]);

      if (charData.data) setCharacters(charData.data);
      if (episodeData.data) setEpisodes(episodeData.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handlePrompt = async (characterPrompt: CharacterPrompt) => {
    if (!characterPrompt.episodeId) {
      toast.error('Episode ID is required');
      return;
    }

    const videoPayload: VideoPayload = {
      character: characterPrompt.name,
      mood: characterPrompt.mood,
      overlays: characterPrompt.overlays || [],
      music: characterPrompt.musicTrack || 'djluckluck',
      episodeId: characterPrompt.episodeId,
    };

    setIsProducing(true);
    setWorkflowStatus({});
    setEpisodeUrl(null);
    setCurrentEpisodeId(videoPayload.episodeId);
    setShowProgress(true);

    try {
      toast.info('🎬 Starting video generation pipeline...');
      
      setWorkflowStatus({ 
        step1: '🎨 Preparing scenes...',
        step2: '🎵 Generating AI scene images...',
      });

      await triggerVideoGeneration(videoPayload);

      setWorkflowStatus({
        scenes: '✅ AI scene images generated',
        manifest: '✅ Video manifest created',
        ready: '✅ Ready for client-side MP4 compilation',
      });
      
      setEpisodeUrl(`/episodes/${videoPayload.episodeId}`);

    } catch (error) {
      setShowProgress(false);
      console.error('Video generation pipeline error:', error);
      toast.error('Production failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleProgressComplete = (videoUrl: string) => {
    setIsProducing(false);
    setShowProgress(false);
    toast.success('🎉 Video Generation Complete!', {
      description: 'AI scenes generated — compile to MP4 in the video player'
    });
    console.log('Video URL:', videoUrl);
  };

  const startProduction = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    const character = characters.find(c => c.id === selectedCharacter);
    
    if (selectedCharacter && character) {
      // Use character-based prompt with complete workflow
      if (!episodes[0]?.id) {
        toast.error('Please create an episode first before generating video');
        return;
      }

      await handlePrompt({
        name: character.name,
        mood: style,
        overlays: ['premium_overlay', 'cinematic_bars', 'character_name'],
        musicTrack: 'reality-tv-urban-hip-hop',
        episodeId: episodes[0].id
      });
    } else {
      // Use traditional director workflow with integrated progress
      setIsProducing(true);
      setWorkflowStatus({});
      setEpisodeUrl(null);

      try {
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

        toast.info('🎬 Director workflow starting - full production pipeline...');

        setWorkflowStatus({ 
          status: '🎬 Activating director workflow...',
        });

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
          setEpisodeUrl(`/episodes/${data.episodeId}`);
          setCurrentEpisodeId(data.episodeId);
          
          // If video was generated, show progress dialog
          if (data.videoUrl) {
            setShowProgress(true);
          }
          
          toast.success('🎉 Production complete!', {
            description: data.videoUrl ? 'Full video generated with 9-phase processing' : 'Episode manifest ready for rendering'
          });
        } else {
          throw new Error('Production failed');
        }

      } catch (error) {
        console.error('Production error:', error);
        toast.error('Production failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      } finally {
        setIsProducing(false);
      }
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

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Character (Optional)</label>
            <Select value={selectedCharacter} onValueChange={setSelectedCharacter} disabled={isProducing}>
              <SelectTrigger>
                <SelectValue placeholder="Select character for focused production" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None (Director Mode)</SelectItem>
                {characters.map(char => (
                  <SelectItem key={char.id} value={char.id}>
                    {char.name} - {char.personality}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Style/Mood</label>
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

        <div className="text-xs text-muted-foreground space-y-1 bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-3 rounded border border-purple-500/20">
          <p className="font-semibold text-foreground mb-2">⚡ <strong>Complete Video Generation Pipeline:</strong></p>
          <div className="space-y-1.5">
            <p className="text-blue-400">🎨 <strong>Overlay Injection:</strong> Premium overlays, cinematic bars, character names</p>
            <p className="text-purple-400">🎵 <strong>Suno Music:</strong> Reality TV / Urban Hip-Hop soundtrack generation</p>
            <p className="text-pink-400">⚡ <strong>God-Level Unified Processor (9 Phases):</strong></p>
            <div className="pl-4 space-y-0.5">
              <p>1️⃣ VMaker: Video stabilization & cinematic motion</p>
              <p>2️⃣ Bing AI: Neural upscaling & viral optimization</p>
              <p>3️⃣ Scene Composer: Cinema-grade transitions</p>
              <p>4️⃣ Frame Optimizer: Maximum detail enhancement</p>
              <p>5️⃣ Color Grader: VH1/BET premium color grading</p>
              <p>6️⃣ Quality Enhancer: Broadcast-grade 1080p/4K</p>
              <p>7️⃣ Effects Bot: Professional motion graphics</p>
              <p>8️⃣ Audio Sync: Frame-perfect synchronization</p>
              <p>9️⃣ Audio Master: Professional mastering (320kbps AAC)</p>
            </div>
            <p className="text-green-400">💾 <strong>Remix Vault:</strong> Auto-export with metadata preservation</p>
          </div>
          <p className="text-primary font-semibold mt-2">✨ Output: VH1/Netflix Premium Quality MP4 in Remix Vault</p>
          <p className="text-xs text-muted-foreground/70 mt-2 italic">
            Commands: /remix, /inject, /suno, /export
          </p>
        </div>
      </CardContent>

      <Dialog open={showProgress} onOpenChange={setShowProgress}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Video Generation in Progress</DialogTitle>
          </DialogHeader>
          {currentEpisodeId && (
            <VideoGenerationProgress 
              episodeId={currentEpisodeId}
              onComplete={handleProgressComplete}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
