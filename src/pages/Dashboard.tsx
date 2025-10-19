import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, BookOpen, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { SystemHealthMonitor } from "@/components/SystemHealthMonitor";
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
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
        supabase.from('episodes').select('title, status, episode_number').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
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
      console.error('Failed to fetch dashboard data:', error);
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
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Your Creative Studio
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your characters, episodes, and projects
          </p>
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
                  <Card key={project.id} className="p-6 bg-card border-border hover:border-primary/30 transition-all cursor-pointer group">
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
                        <Link to="/create">
                          <Button variant="ghost" size="sm">Manage</Button>
                        </Link>
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
                  <Card key={episode.title} className="p-4 bg-card border-border hover:border-accent/30 transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{episode.title}</h3>
                        <p className="text-sm text-muted-foreground">{episode.status || 'Draft'} • Episode {episode.episode_number}</p>
                      </div>
                      <Link to="/episodes">
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
    </div>
  );
};

export default Dashboard;
