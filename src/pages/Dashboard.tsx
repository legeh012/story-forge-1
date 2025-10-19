import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, BookOpen, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { SystemHealthMonitor } from "@/components/SystemHealthMonitor";
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setLoading(false);
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
          <Card className="p-6 bg-card border-border hover:border-primary/50 transition-all cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">12</p>
                <p className="text-muted-foreground">Characters</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border hover:border-accent/50 transition-all cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <BookOpen className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-3xl font-bold">8</p>
                <p className="text-muted-foreground">Episodes</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border hover:border-primary-glow/50 transition-all cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary-glow/10 group-hover:bg-primary-glow/20 transition-colors">
                <Sparkles className="h-6 w-6 text-primary-glow" />
              </div>
              <div>
                <p className="text-3xl font-bold">3</p>
                <p className="text-muted-foreground">Active Projects</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mb-8">
          <SystemHealthMonitor />
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
              {[
                { name: "Elena Storm", type: "Protagonist", episodes: 5 },
                { name: "Marcus Vale", type: "Antagonist", episodes: 3 },
                { name: "Aria Chen", type: "Supporting", episodes: 4 },
              ].map((character) => (
                <Card key={character.name} className="p-4 bg-card border-border hover:border-primary/30 transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{character.name}</h3>
                      <p className="text-sm text-muted-foreground">{character.type} • {character.episodes} episodes</p>
                    </div>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                </Card>
              ))}
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
              {[
                { title: "The Awakening", status: "Published", characters: 3 },
                { title: "Shadows Rising", status: "Draft", characters: 4 },
                { title: "Breaking Point", status: "In Progress", characters: 2 },
              ].map((episode) => (
                <Card key={episode.title} className="p-4 bg-card border-border hover:border-accent/30 transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{episode.title}</h3>
                      <p className="text-sm text-muted-foreground">{episode.status} • {episode.characters} characters</p>
                    </div>
                    <Button variant="ghost" size="sm">View</Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
