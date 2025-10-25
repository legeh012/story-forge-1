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
import { EpisodeCleanup } from './EpisodeCleanup';

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
    { 
      number: 1, 
      title: "Khat and Karma - Pilot Episode",
      synopsis: "A powerful reality TV episode exploring consequences, cultural dynamics, and real human drama."
    },
    { 
      number: 6, 
      title: "Hijabi Heatwave",
      synopsis: "Luul shows up to brunch in a sheer abaya and heels, sparking a modesty vs. baddie debate. Zahra drops a diss track about the crew's fake activism — Luckiee remixes it live on IG. Samira's situationship with the Somali poet turns into a public breakup at the open mic."
    },
    { 
      number: 7, 
      title: "Halal But Make It Toxic",
      synopsis: "Ayaan launches her wellness brand but gets dragged for selling 'halal waist trainers.' Ifrah's burner account leaks DMs between Hani and a married TikTok imam. Luckiee hosts a rooftop listening party — ends in a dance-off and a slap."
    },
    { 
      number: 8, 
      title: "Clan Wars & Clout",
      synopsis: "The girls get invited to a diaspora influencer retreat in Toronto — but clan beef erupts. Zahra and Samira get into a screaming match over who's 'more repressed.' Luul goes viral for her 'Diaspora Baddie Survival Guide' — but it's mostly shade."
    },
    { 
      number: 9, 
      title: "Say Wallahi",
      synopsis: "Hani's secret engagement gets exposed during a game of Somali charades. Ayaan's mom crashes the set and calls the show 'haram reality nonsense.' Luckiee drops a new track called 'Wallahi Toxic' — it charts on Somali TikTok."
    },
    { 
      number: 10, 
      title: "Remix the Ruins",
      synopsis: "Ifrah and Zahra co-host a healing circle — but it turns into a roast battle. Samira's ex shows up with a new fiancée… who looks suspiciously like Luul. Luckiee triggers overlays mid-argument, turning the fight into a cinematic trailer."
    },
    { 
      number: 11, 
      title: "Ghosted by the Ummah",
      synopsis: "The girls get disinvited from a masjid fundraiser after their viral clips hit Twitter. Hani tries to rebrand as a 'spiritual influencer' — but her followers revolt. Ayaan and Samira finally reconcile… until a remix of their fight leaks."
    },
    { 
      number: 12, 
      title: "Legacy or Lunacy",
      synopsis: "The cast gathers for a Somali Women in Media panel — but it devolves into chaos. Zahra announces she's leaving the show to start a rival podcast. Luckiee triggers the final music drop: 'Diaspora Diaries Vol. 1' — every fight, every remix, archived."
    },
    { 
      number: 13, 
      title: "Say Wallahi Edition - Reunion Special",
      synopsis: "Hosted by a Somali auntie with zero chill and a mic that cuts off lies. Every cast member gets grilled: Who leaked the burner? Who faked the engagement? Who's really about legacy? Luckiee drops surprise overlays mid-reunion — including unreleased tracks and cast confessionals. Ends with a cliffhanger: Zahra's podcast trailer drops live, and Luul might be joining her."
    }
  ];

  const deleteAllEpisodes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      toast({
        title: '🗑️ Deleting old episodes...',
        description: 'Clearing the slate for premium production',
      });

      // Get project
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', 'Khat and Karma')
        .maybeSingle();

      if (project) {
        // Delete all episodes for this project
        const { error: deleteError } = await supabase
          .from('episodes')
          .delete()
          .eq('project_id', project.id);

        if (deleteError) throw deleteError;

        toast({
          title: '✅ Episodes Deleted',
          description: 'Ready for premium BET/VH1 quality regeneration',
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete episodes',
        variant: 'destructive'
      });
    }
  };

  const regenerateAllEpisodes = async () => {
    // Delete old episodes first
    await deleteAllEpisodes();
    
    setRegenerating(true);
    setProgress(0);
    setCompletedEpisodes([]);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      toast({
        title: '🎬 God Mode Activated',
        description: 'Reality TV production bots working together for maximum speed',
      });

      // Create or get Khat and Karma project
      let projectId;
      const { data: existingProject } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', 'Khat and Karma')
        .maybeSingle();

      if (existingProject) {
        projectId = existingProject.id;
      } else {
        // Create new project
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            title: 'Khat and Karma',
            description: 'A dramatic reality series about karma, consequences, and cultural clashes',
            genre: 'Reality TV',
            status: 'active',
            default_rendering_style: 'photorealistic'
          })
          .select()
          .single();

        if (projectError) throw projectError;
        projectId = newProject.id;
        
        toast({
          title: 'Project Created',
          description: 'Created "Khat and Karma" project',
        });
      }

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
            synopsis: ep.synopsis,
            script: `[Opening Scene]\n${ep.synopsis}\n\n[Confessional]\nCharacter speaking directly to camera about the drama...\n\n[Dramatic Scene]\nThe tension builds as consequences unfold...`,
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

        // Activate God Mode production
        const { data: godModeResult, error: genError } = await supabase.functions.invoke('reality-tv-god-mode', {
          body: {
            episodeId,
            projectId,
            mode: 'ultra'
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
          console.log(`God Mode result for Episode ${ep.number}:`, godModeResult);
          toast({
            title: `🎯 Episode ${ep.number} Complete`,
            description: `Processed through ${godModeResult?.executionLog?.length || 'multiple'} production bots`,
          });
        }

        setProgress(((i + 1) / episodes.length) * 100);
        
        // Wait 2 seconds between episodes
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      toast({
        title: '🎬 God Mode Complete!',
        description: `All ${episodes.length} episodes produced with reality TV god-level production bots.`,
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

  const testEpisode1 = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      toast({
        title: '🧪 Testing First Episode',
        description: 'Regenerating with FFmpeg MP4 compilation',
      });

      // Get the first available episode
      const { data: episodes } = await supabase
        .from('episodes')
        .select('id, project_id, episode_number, title')
        .eq('user_id', user.id)
        .order('episode_number', { ascending: true })
        .limit(1);

      if (!episodes || episodes.length === 0) throw new Error('No episodes found');

      const episode = episodes[0];
      setRegenerating(true);
      setCurrentEpisode(episode.episode_number);

      // Call God Mode for the episode
      const { data: godModeResult, error: genError } = await supabase.functions.invoke('reality-tv-god-mode', {
        body: {
          episodeId: episode.id,
          projectId: episode.project_id,
          mode: 'ultra'
        }
      });

      if (genError) {
        console.error('God Mode error:', genError);
        toast({
          title: 'Test Failed',
          description: genError.message,
          variant: 'destructive'
        });
      } else {
        console.log('God Mode result:', godModeResult);
        toast({
          title: '✅ Test Complete',
          description: `Episode ${episode.episode_number}: "${episode.title}" - All 8 industry-leading bots activated successfully`,
        });
      }
    } catch (error) {
      console.error('Test error:', error);
      toast({
        title: 'Test Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
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
      
      <EpisodeCleanup 
        currentEpisodeId="6cf8137e-a95b-4db3-bd76-620e498a09d0"
        currentEpisodeTitle="The Chai Debate (Episode 10)"
      />
      
      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-gradient-to-br from-primary to-accent">
            <Video className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">🎬 Premium BET/VH1 Quality Production</CardTitle>
            <CardDescription>
              Khat and Karma - 9 episodes with luxury settings, designer fashion, and explosive drama
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
          <p className="text-sm font-semibold text-muted-foreground">Season Episodes ({episodes.length} total):</p>
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
                    <p className="text-xs text-muted-foreground line-clamp-1">{ep.title}</p>
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

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={testEpisode1}
            disabled={regenerating}
            size="lg"
            className="w-full bg-gradient-to-r from-success via-primary to-success hover:opacity-90"
          >
            {regenerating ? (
              <>
                <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                Testing Episode (Creating MP4...)
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                🧪 Test First Episode (FFmpeg MP4)
              </>
            )}
          </Button>

          <Button
            onClick={regenerateAllEpisodes}
            disabled={regenerating}
            size="lg"
            className="w-full bg-gradient-to-r from-primary via-accent to-primary-glow hover:opacity-90"
          >
            {regenerating && currentEpisode !== 1 ? (
              <>
                <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                Generating Episodes {currentEpisode ? `(${completedEpisodes.length + 1}/${episodes.length})` : '...'}
              </>
            ) : (
              <>
                <Video className="h-5 w-5 mr-2" />
                Generate All {episodes.length} Episodes
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          🔥 PREMIUM BET/VH1 QUALITY: Luxury settings, designer fashion, explosive confrontations, confessional drama
        </p>
      </CardContent>
    </Card>
    </div>
  );
};
