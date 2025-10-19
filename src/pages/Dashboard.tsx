import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, BookOpen, Sparkles, Zap, Play, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { SystemHealthMonitor } from "@/components/SystemHealthMonitor";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generatingEpisode, setGeneratingEpisode] = useState(false);
  const [activatingBots, setActivatingBots] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [stats, setStats] = useState({
    characters: 0,
    episodes: 0,
    projects: 0
  });
  const [recentCharacters, setRecentCharacters] = useState<any[]>([]);
  const [recentEpisodes, setRecentEpisodes] = useState<any[]>([]);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setLoading(false);
      fetchDashboardData(session.user.id);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate('/auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchDashboardData = async (userId: string) => {
    try {
      const [charCount, epCount, projCount, chars, eps, projs] = await Promise.all([
        supabase.from('characters').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('episodes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('characters').select('name, role').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
        supabase.from('episodes').select('id, title, status, episode_number').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
        supabase.from('projects').select('id, title, description, status, genre').eq('user_id', userId).order('created_at', { ascending: false }).limit(3)
      ]);

      setStats({
        characters: charCount.count || 0,
        episodes: epCount.count || 0,
        projects: projCount.count || 0
      });

      setRecentCharacters(chars.data || []);
      setRecentEpisodes(eps.data || []);
      setRecentProjects(projs.data || []);
    } catch (error) {
      // Failed to fetch dashboard data
    }
  };

  const activateProductionBots = async () => {
    setActivatingBots(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Activate essential bots for production
      const essentialBots = [
        'ultra_video',
        'script_generator',
        'cultural_injection',
        'hook_optimization',
        'performance_tracker'
      ] as const;

      const { error } = await supabase
        .from('viral_bots')
        .update({ is_active: true })
        .eq('user_id', user.id)
        .in('bot_type', essentialBots as any);

      if (error) throw error;

      toast({
        title: "Bots Activated",
        description: "Production bots are now active and ready",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to activate bots",
        variant: "destructive",
      });
    } finally {
      setActivatingBots(false);
    }
  };

  const generateFirstEpisode = async () => {
    setGeneratingEpisode(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const projectId = 'ebae852a-56f4-4199-bea8-1b78f66d88c4'; // Real Sisters in the diaspora

      // Check if episode 1 already exists
      const { data: existingEpisode } = await supabase
        .from('episodes')
        .select('*')
        .eq('project_id', projectId)
        .eq('episode_number', 1)
        .maybeSingle();

      if (existingEpisode) {
        toast({
          title: "Episode Exists",
          description: "Episode 1 already exists. Regenerating...",
        });
      }

      // Create or update episode 1
      const episodeData = {
        project_id: projectId,
        user_id: user.id,
        episode_number: 1,
        season: 1,
        title: "Say Walahi, We're Live",
        synopsis: "The sisters make their grand entrance with glam confessionals. Ayaan and Ifrah clash over boutique drama while Zahra leaks receipts. Nasra crashes the launch with her own documentation.",
        script: "FADE IN: CONFESSIONAL - AYAAN (in hijab and designer blazer): 'When they said reality TV, I said reality CHECK. These sisters better bring receipts because I INVENTED the paper trail.' [Cut to boutique launch chaos]",
        status: 'draft',
        video_status: 'not_started'
      };

      let episodeId;
      if (existingEpisode) {
        const { error } = await supabase
          .from('episodes')
          .update(episodeData)
          .eq('id', existingEpisode.id);
        if (error) throw error;
        episodeId = existingEpisode.id;
      } else {
        const { data, error } = await supabase
          .from('episodes')
          .insert(episodeData)
          .select()
          .single();
        if (error) throw error;
        episodeId = data.id;
      }

      // Trigger Ultra Video Bot
      const { error: botError } = await supabase.functions.invoke('ultra-video-bot', {
        body: { 
          episodeId,
          enhancementLevel: 'ultra'
        }
      });

      if (botError) throw botError;

      toast({
        title: "Episode Generation Started",
        description: "Ultra Video Bot is creating Episode 1 with advanced AI",
      });

      // Refresh dashboard data
      fetchDashboardData(user.id);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate episode",
        variant: "destructive",
      });
    } finally {
      setGeneratingEpisode(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectToDelete)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Project Deleted",
        description: "The project has been permanently removed",
      });

      // Refresh dashboard
      fetchDashboardData(user.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Your Creative Studio
              </h1>
              <p className="text-muted-foreground text-lg">
                Manage your characters, episodes, and projects
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={activateProductionBots}
                disabled={activatingBots}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
              >
                <Zap className="h-4 w-4 mr-2" />
                {activatingBots ? "Activating..." : "Activate Bots"}
              </Button>
              <Button 
                onClick={generateFirstEpisode}
                disabled={generatingEpisode}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                <Play className="h-4 w-4 mr-2" />
                {generatingEpisode ? "Generating..." : "Generate Episode 1"}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link to="/characters" className="block">
            <Card className="p-6 bg-card border-border hover:border-primary/50 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.characters}</p>
                  <p className="text-muted-foreground">Characters</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/episodes" className="block">
            <Card className="p-6 bg-card border-border hover:border-accent/50 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <BookOpen className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.episodes}</p>
                  <p className="text-muted-foreground">Episodes</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/create" className="block">
            <Card className="p-6 bg-card border-border hover:border-primary-glow/50 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary-glow/10 group-hover:bg-primary-glow/20 transition-colors">
                  <Sparkles className="h-6 w-6 text-primary-glow" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.projects}</p>
                  <p className="text-muted-foreground">Active Projects</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Your Projects</h2>
            <Link to="/create">
              <Button size="sm" className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentProjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">No projects yet</p>
                <Link to="/create">
                  <Button size="sm">Create your first project</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentProjects.map((project) => (
                  <Card key={project.id} className="p-6 bg-card border-border hover:border-primary/30 transition-all group">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{project.title}</h3>
                          {project.genre && (
                            <Badge variant="outline" className="text-xs">{project.genre}</Badge>
                          )}
                        </div>
                        <Sparkles className="h-5 w-5 text-primary-glow opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                      )}
                      <div className="flex items-center justify-between pt-2">
                        <Badge className={project.status === 'active' ? 'bg-success' : 'bg-muted'}>
                          {project.status || 'draft'}
                        </Badge>
                        <div className="flex gap-2">
                          <Link to={`/characters?projectId=${project.id}`}>
                            <Button variant="outline" size="sm" className="border-primary/30">
                              <Users className="h-3 w-3 mr-1" />
                              Characters
                            </Button>
                          </Link>
                          <Link to={`/episodes?projectId=${project.id}`}>
                            <Button variant="ghost" size="sm">
                              <BookOpen className="h-3 w-3 mr-1" />
                              Episodes
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setProjectToDelete(project.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Recent Characters</h2>
              <Link to="/characters">
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  New Character
                </Button>
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentCharacters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">No characters yet</p>
                  <Link to="/characters">
                    <Button size="sm">Create your first character</Button>
                  </Link>
                </div>
              ) : (
                recentCharacters.map((character) => (
                  <Card key={character.name} className="p-4 bg-card border-border hover:border-primary/30 transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{character.name}</h3>
                        <p className="text-sm text-muted-foreground">{character.role || 'Character'}</p>
                      </div>
                      <Link to="/characters">
                        <Button variant="ghost" size="sm">Edit</Button>
                      </Link>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Recent Episodes</h2>
              <Link to="/episodes">
                <Button size="sm" className="bg-accent hover:bg-accent/90">
                  <Plus className="h-4 w-4 mr-2" />
                  New Episode
                </Button>
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentEpisodes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">No episodes yet</p>
                  <Link to="/episodes">
                    <Button size="sm">Create your first episode</Button>
                  </Link>
                </div>
              ) : (
                recentEpisodes.map((episode) => (
                  <Card key={episode.id} className="p-4 bg-card border-border hover:border-accent/30 transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{episode.title}</h3>
                        <p className="text-sm text-muted-foreground">{episode.status || 'Draft'} • Episode {episode.episode_number}</p>
                      </div>
                      <Link to={`/episodes/${episode.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this project and all associated episodes, characters, and media. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProject}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
