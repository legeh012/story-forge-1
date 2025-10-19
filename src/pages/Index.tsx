import Navigation from "@/components/Navigation";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Users, BookOpen, Zap, Globe, Palette, Clapperboard, Play } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate("/auth", { replace: true });
        } else {
          setIsAuthenticated(true);
          setTimeout(() => {
            fetchData();
          }, 0);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth", { replace: true });
      } else {
        setIsAuthenticated(true);
        fetchData();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [projectsRes, episodesRes] = await Promise.all([
        supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('episodes')
          .select('*, projects!inner(title)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(6)
      ]);

      setProjects(projectsRes.data || []);
      setEpisodes(episodesRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="StoryForge - Create Viral AI Stories | YouTube, TikTok, Instagram Automation"
        description="Create viral interactive stories with AI. Auto-publish to YouTube, TikTok, Instagram. Trending hashtags, SEO optimization, and viral analytics built-in. Start going viral today!"
        keywords={['viral content', 'AI storytelling', 'YouTube automation', 'TikTok viral', 'Instagram reels', 'content creator', 'trending videos', 'social media automation']}
      />
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary">AI-Powered Storytelling Platform</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary-glow bg-clip-text text-transparent leading-tight">
              Create Interactive Stories That Live Forever
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Build immersive applications with persistent characters, episodic storytelling, 
              and seamless cross-platform deployment—all powered by advanced AI.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/create">
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-lg px-8">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-primary/50 hover:bg-primary/10 text-lg px-8">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Everything You Need to Bring Stories to Life
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Powerful features designed for creators, writers, and developers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Link to="/characters">
            <Card className="p-6 bg-card border-border hover:border-primary/50 transition-all group cursor-pointer h-full">
              <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Character Continuity</h3>
              <p className="text-muted-foreground">
                Characters remember their traits, histories, and relationships across all episodes and formats.
              </p>
              <div className="mt-4 flex items-center text-primary text-sm">
                Manage Characters <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </Card>
          </Link>

          <Link to="/workflow?tab=episodes">
            <Card className="p-6 bg-card border-border hover:border-accent/50 transition-all group cursor-pointer h-full">
              <div className="p-3 rounded-xl bg-accent/10 w-fit mb-4 group-hover:bg-accent/20 transition-colors">
                <BookOpen className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Episodic Generation</h3>
              <p className="text-muted-foreground">
                AI creates subsequent episodes while maintaining perfect narrative consistency.
              </p>
              <div className="mt-4 flex items-center text-accent text-sm">
                Create Episodes <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </Card>
          </Link>

          <Link to="/create">
            <Card className="p-6 bg-card border-border hover:border-primary-glow/50 transition-all group cursor-pointer h-full">
              <div className="p-3 rounded-xl bg-primary-glow/10 w-fit mb-4 group-hover:bg-primary-glow/20 transition-colors">
                <Zap className="h-6 w-6 text-primary-glow" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Multi-Modal Input</h3>
              <p className="text-muted-foreground">
                Create with text, voice, images, and sketches—AI understands it all.
              </p>
              <div className="mt-4 flex items-center text-primary-glow text-sm">
                Start Creating <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </Card>
          </Link>

          <Link to="/analytics">
            <Card className="p-6 bg-card border-border hover:border-accent/50 transition-all group cursor-pointer h-full">
              <div className="p-3 rounded-xl bg-accent/10 w-fit mb-4 group-hover:bg-accent/20 transition-colors">
                <Globe className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Cross-Platform Deploy</h3>
              <p className="text-muted-foreground">
                Publish to iOS, Android, web, and AR/VR with a single click.
              </p>
              <div className="mt-4 flex items-center text-accent text-sm">
                View Analytics <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </Card>
          </Link>

          <Link to="/viral-bots">
            <Card className="p-6 bg-card border-border hover:border-primary/50 transition-all group cursor-pointer h-full">
              <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                <Palette className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Driven Optimization</h3>
              <p className="text-muted-foreground">
                Activate viral bots to optimize content for trending hashtags, hooks, and engagement.
              </p>
              <div className="mt-4 flex items-center text-primary text-sm">
                Manage Bots <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </Card>
          </Link>

          <Link to="/media">
            <Card className="p-6 bg-card border-border hover:border-primary-glow/50 transition-all group cursor-pointer h-full">
              <div className="p-3 rounded-xl bg-primary-glow/10 w-fit mb-4 group-hover:bg-primary-glow/20 transition-colors">
                <Sparkles className="h-6 w-6 text-primary-glow" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Media Generation</h3>
              <p className="text-muted-foreground">
                Automatically generate videos, animations, and visuals aligned with your narrative.
              </p>
              <div className="mt-4 flex items-center text-primary-glow text-sm">
                Media Library <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </Card>
          </Link>
        </div>
      </section>

      {/* Recent Projects & Episodes Section */}
      {isAuthenticated && !loading && (projects.length > 0 || episodes.length > 0) && (
        <section className="py-20 container mx-auto px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            {/* Recent Projects */}
            {projects.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold">Your Recent Projects</h2>
                  <Link to="/workflow">
                    <Button variant="outline">
                      View All
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {projects.map((project) => (
                    <Card 
                      key={project.id}
                      className="cursor-pointer hover:border-primary/50 transition-all"
                      onClick={() => navigate('/workflow')}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{project.title}</CardTitle>
                          <Badge variant={project.status === 'published' ? 'default' : 'secondary'}>
                            {project.status}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {project.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{project.genre}</Badge>
                          <Badge variant="outline">{project.mood}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Episodes */}
            {episodes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold">Latest Episodes</h2>
                  <Link to="/workflow?tab=episodes">
                    <Button variant="outline">
                      View All
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {episodes.map((episode) => (
                    <Card 
                      key={episode.id}
                      className="cursor-pointer hover:border-primary/50 transition-all"
                      onClick={() => navigate('/workflow?tab=episodes')}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Clapperboard className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {(episode as any).projects?.title}
                              </span>
                            </div>
                            <CardTitle className="text-lg">{episode.title}</CardTitle>
                          </div>
                          <Badge variant={episode.video_status === 'completed' ? 'default' : 'secondary'}>
                            {episode.video_status || 'draft'}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2">
                          Episode {episode.episode_number} • Season {episode.season}
                        </CardDescription>
                      </CardHeader>
                      {episode.video_url && (
                        <CardContent>
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(episode.video_url, '_blank');
                            }}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Watch Episode
                          </Button>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 container mx-auto px-4">
        <Card className="relative overflow-hidden p-12 bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Transform Your Stories?
            </h2>
            <p className="text-lg text-foreground/80 mb-8">
              Join thousands of creators building the next generation of interactive experiences.
            </p>
            <Link to={isAuthenticated ? "/workflow" : "/auth"}>
              <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-lg px-8">
                {isAuthenticated ? "Go to Workflow" : "Start Creating Now"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default Index;
