import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Sparkles, Mic, Users, Play, CheckCircle2, Youtube } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SmartLoadingState } from './SmartLoadingState';
import { Progress } from '@/components/ui/progress';
import { YouTubeIntegrationStatus } from './YouTubeIntegrationStatus';

interface Episode {
  id: string;
  episode_number: number;
  title: string;
  video_status: string;
}

export const EpisodeRegenerator = () => {
  const { toast } = useToast();
  const [regenerating, setRegenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentEpisode, setCurrentEpisode] = useState<number | null>(null);
  const [completedEpisodes, setCompletedEpisodes] = useState<number[]>([]);

  const episodes = [
    { number: 1, title: "Say Walahi, We're Live" },
    { number: 2, title: "Boutique Drama Unfolds" },
    { number: 3, title: "Receipts Revealed" },
    { number: 4, title: "The Confrontation" },
    { number: 5, title: "Family Secrets" }
  ];

  const regenerateAllEpisodes = async () => {
    setRegenerating(true);
    setProgress(0);
    setCompletedEpisodes([]);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const projectId = 'ebae852a-56f4-4199-bea8-1b78f66d88c4'; // Real Sisters project

      for (let i = 0; i < episodes.length; i++) {
        const ep = episodes[i];
        setCurrentEpisode(ep.number);
        
        toast({
          title: `Generating Episode ${ep.number}`,
          description: `${ep.title} - Creating cinematic scenes with voiceovers...`,
        });

        // Check if episode exists
        const { data: existingEpisode } = await supabase
          .from('episodes')
          .select('id')
          .eq('project_id', projectId)
          .eq('episode_number', ep.number)
          .maybeSingle();

        let episodeId;

        if (existingEpisode) {
          episodeId = existingEpisode.id;
          // Update existing episode
          await supabase
            .from('episodes')
            .update({
              title: ep.title,
              video_status: 'not_started',
              updated_at: new Date().toISOString()
            })
            .eq('id', episodeId);
        } else {
          // Create new episode
          const episodeData = {
            project_id: projectId,
            user_id: user.id,
            episode_number: ep.number,
            season: 1,
            title: ep.title,
            synopsis: `Episode ${ep.number}: ${ep.title} - A dramatic installment in the Real Sisters in the Diaspora series.`,
            script: `[Opening Scene]\nThe drama continues in episode ${ep.number}...\n\n[Confessional]\nCharacter speaking directly to camera...\n\n[Scene]\nDramatic confrontation unfolds...`,
            status: 'draft',
            video_status: 'not_started'
          };

          const { data: newEpisode, error } = await supabase
            .from('episodes')
            .insert(episodeData)
            .select()
            .single();

          if (error) throw error;
          episodeId = newEpisode.id;
        }

        // Generate cinematic video
        const { error: genError } = await supabase.functions.invoke('cinematic-video-generator', {
          body: {
            episodeId,
            quality: 'cinematic'
          }
        });

        if (genError) {
          console.error(`Error generating episode ${ep.number}:`, genError);
          toast({
            title: `Episode ${ep.number} Failed`,
            description: genError.message,
            variant: 'destructive'
          });
        } else {
          setCompletedEpisodes(prev => [...prev, ep.number]);
          toast({
            title: `Episode ${ep.number} Started`,
            description: 'Video generation in progress with scenes, voiceovers, and natural movement',
          });
        }

        setProgress(((i + 1) / episodes.length) * 100);
        
        // Wait 2 seconds between episodes
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      toast({
        title: 'All Episodes Queued!',
        description: 'Episodes 1-5 are being generated with cinematic quality, voiceovers, and natural movement.',
      });

    } catch (error) {
      console.error('Regeneration error:', error);
      toast({
        title: 'Regeneration Failed',
        description: error instanceof Error ? error.message : 'Failed to regenerate episodes',
        variant: 'destructive'
      });
    } finally {
      setRegenerating(false);
      setCurrentEpisode(null);
    }
  };

  return (
    <div className="space-y-4">
      <YouTubeIntegrationStatus />
      
      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-gradient-to-br from-primary to-accent">
            <Video className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Cinematic Episode Generator</CardTitle>
            <CardDescription>
              Regenerate Episodes 1-5 with scenes, voiceovers, actors, and natural movement
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border">
            <Video className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Scenes</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border">
            <Mic className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium">Voiceovers</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border">
            <Users className="h-4 w-4 text-primary-glow" />
            <span className="text-sm font-medium">Actors</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border">
            <Play className="h-4 w-4 text-success" />
            <span className="text-sm font-medium">Movement</span>
          </div>
        </div>

        {/* Episodes List */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">Episodes to Generate:</p>
          <div className="space-y-2">
            {episodes.map((ep) => (
              <div
                key={ep.number}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  completedEpisodes.includes(ep.number)
                    ? 'bg-success/10 border-success/30'
                    : currentEpisode === ep.number
                    ? 'bg-primary/10 border-primary/30 animate-pulse'
                    : 'bg-card border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
                    completedEpisodes.includes(ep.number)
                      ? 'bg-success text-white'
                      : currentEpisode === ep.number
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {completedEpisodes.includes(ep.number) ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-bold">{ep.number}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Episode {ep.number}</p>
                    <p className="text-xs text-muted-foreground">{ep.title}</p>
                  </div>
                </div>
                {currentEpisode === ep.number && (
                  <Badge variant="outline" className="animate-pulse">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Generating...
                  </Badge>
                )}
                {completedEpisodes.includes(ep.number) && (
                  <Badge className="bg-success">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Queued
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Progress */}
        {regenerating && (
          <div className="space-y-3">
            <Progress value={progress} className="h-2" />
            <SmartLoadingState
              operation="rendering-video"
              message="Creating production-grade episodes with cinematic scenes"
            />
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={regenerateAllEpisodes}
          disabled={regenerating}
          size="lg"
          className="w-full bg-gradient-to-r from-primary via-accent to-primary-glow hover:opacity-90"
        >
          {regenerating ? (
            <>
              <Sparkles className="h-5 w-5 mr-2 animate-spin" />
              Generating Episodes {currentEpisode ? `(${currentEpisode}/5)` : '...'}
            </>
          ) : (
            <>
              <Video className="h-5 w-5 mr-2" />
              Generate Episodes 1-5
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Each episode will have 8-12 cinematic scenes with AI voiceovers, natural movement, and automatic YouTube upload
        </p>
      </CardContent>
    </Card>
    </div>
  );
};
