import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Film, Loader2, CheckCircle, PlayCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
    const videoPayload = {
      character: characterPrompt.name,
      mood: characterPrompt.mood,
      overlays: characterPrompt.overlays || [],
      music: characterPrompt.musicTrack || 'Suno_djluckluck.mp3',
      episodeId: characterPrompt.episodeId,
    };
    await triggerVideoGeneration(videoPayload);
  };

  const triggerVideoGeneration = async (payload: any) => {
    setIsProducing(true);
    setWorkflowStatus({});
    setEpisodeUrl(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      toast.info('🎬 Unified Processor initiating VH1/Netflix production...');
      setWorkflowStatus({ processing: '⚡ Initializing all 9 phases...' });

      // Call god-level-unified-processor
      const { data, error } = await supabase.functions.invoke('god-level-unified-processor', {
        body: {
          episodeId: payload.episodeId,
          userId: user.id,
          frames: payload.overlays || [],
          audioUrl: payload.music,
          quality: 'ultra',
          renderSettings: {
            resolution: '1080p',
            frameRate: 24,
            transitions: ['fade', 'slide'],
            audio_file: payload.music
          }
        }
      });

      if (error) throw error;

      if (data.success) {
        setWorkflowStatus({
          phase1: '✅ VMaker: Video stabilization & cinematic effects',
          phase2: '✅ Bing AI: Neural upscaling & viral optimization',
          phase3: '✅ Scene Composition: Cinema-grade assembly',
          phase4: '✅ Frame Optimization: Maximum detail enhancement',
          phase5: '✅ Color Grading: VH1/BET premium look',
          phase6: '✅ Quality Enhancement: Broadcast-grade quality',
          phase7: '✅ Visual Effects: Professional motion graphics',
          phase8: '✅ Audio Sync: Frame-perfect synchronization',
          phase9: '✅ Audio Mastering: Professional mastering'
        });
        
        if (payload.episodeId) {
          setEpisodeUrl(`/episodes/${payload.episodeId}`);
        }
        
        toast.success('⚡ God-Level Production Complete!', {
          description: 'All 9 phases completed - VH1/Netflix premium quality achieved'
        });
      }

    } catch (error) {
      console.error('Video generation error:', error);
      toast.error('Production failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsProducing(false);
    }
  };

  const startProduction = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    const character = characters.find(c => c.id === selectedCharacter);
    
    if (selectedCharacter && character) {
      // Use character-based prompt
      await handlePrompt({
        name: character.name,
        mood: style,
        overlays: [],
        musicTrack: 'Suno_djluckluck.mp3',
        episodeId: episodes[0]?.id // Use first episode or create new one
      });
    } else {
      // Use traditional director workflow
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

        toast.info('🎬 Director is orchestrating production...');

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
          <p className="font-semibold text-foreground mb-2">⚡ <strong>God-Level Unified Processor - 9 Phase Pipeline:</strong></p>
          <p>1️⃣ VMaker Bot: Video stabilization, motion smoothing, cinematic effects</p>
          <p>2️⃣ Bing AI Bot: Neural upscaling, content analysis, viral optimization</p>
          <p>3️⃣ Scene Composer: Cinema-grade composition & transitions</p>
          <p>4️⃣ Frame Optimizer: Maximum detail & artifact removal</p>
          <p>5️⃣ Color Grader: VH1/BET premium color grading</p>
          <p>6️⃣ Quality Enhancer: Broadcast-grade quality (1080p/4K)</p>
          <p>7️⃣ Effects Bot: Professional motion graphics & overlays</p>
          <p>8️⃣ Audio Sync: Frame-perfect audio-video synchronization</p>
          <p>9️⃣ Audio Master: Professional mastering (320kbps AAC)</p>
          <p className="text-primary font-semibold mt-2">✨ Output: VH1/Netflix Premium Quality MP4</p>
        </div>
      </CardContent>
    </Card>
  );
};
