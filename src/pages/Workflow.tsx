import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Play, Pause, Video, Users, FileText, TrendingUp, 
  Clapperboard, Sparkles, Clock, CheckCircle2, AlertCircle,
  Upload, Settings, BarChart3
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VideoRenderer } from "@/components/VideoRenderer";
import { RealismAudit } from "@/components/RealismAudit";

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  genre: string;
  mood: string;
  theme: string;
  created_at: string;
}

interface Episode {
  id: string;
  project_id: string;
  title: string;
  episode_number: number;
  season: number;
  status: string;
  synopsis: string;
}

interface Character {
  id: string;
  project_id: string;
  name: string;
  role: string;
  personality: string;
  background: string;
}

const Workflow = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  
  // New project form state
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    genre: "Reality TV",
    mood: "Dramatic",
    theme: "Diaspora Life"
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setAuthLoading(false);
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

  useEffect(() => {
    if (!authLoading) {
      fetchProjects();
    }
  }, [authLoading]);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectDetails(selectedProject);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
      if (data && data.length > 0) {
        setSelectedProject(data[0].id);
      }
    } catch (error: any) {
      toast({
        title: "Error loading projects",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDetails = async (projectId: string) => {
    try {
      const [episodesRes, charactersRes] = await Promise.all([
        supabase.from("episodes").select("*").eq("project_id", projectId).order("episode_number"),
        supabase.from("characters").select("*").eq("project_id", projectId)
      ]);

      setEpisodes(episodesRes.data || []);
      setCharacters(charactersRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error loading project details",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const createProject = async () => {
    if (!newProject.title) {
      toast({
        title: "Title required",
        description: "Please enter a project title",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("projects")
        .insert([{
          ...newProject,
          user_id: user.id,
          status: "draft"
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Project created!",
        description: `${newProject.title} is ready to go`
      });

      setProjects([data, ...projects]);
      setSelectedProject(data.id);
      setNewProject({
        title: "",
        description: "",
        genre: "Reality TV",
        mood: "Dramatic",
        theme: "Diaspora Life"
      });
    } catch (error: any) {
      toast({
        title: "Error creating project",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const triggerBotPipeline = async (botType: string) => {
    if (!selectedProject) return;

    toast({
      title: `${botType} Bot Activated`,
      description: "Processing your content...",
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await supabase.from("bot_activities").insert([{
        user_id: user.id,
        status: "running",
        results: { project_id: selectedProject, bot_type: botType }
      }]);

      toast({
        title: "Bot pipeline started",
        description: "Check the Viral Bots page for progress"
      });
    } catch (error: any) {
      toast({
        title: "Error starting bot",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const currentProject = projects.find(p => p.id === selectedProject);

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary-glow bg-clip-text text-transparent">
                Project Workflow
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage your reality show production from concept to distribution
              </p>
            </div>
            <Button onClick={() => navigate("/viral-bots")} variant="outline">
              <Sparkles className="mr-2 h-4 w-4" />
              Manage Bots
            </Button>
          </div>

          <Tabs defaultValue="projects" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="episodes">Episodes</TabsTrigger>
              <TabsTrigger value="cast">Cast</TabsTrigger>
              <TabsTrigger value="automation">Bot Automation</TabsTrigger>
            </TabsList>

            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Project</CardTitle>
                  <CardDescription>Start a new reality show production</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Show Title</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Real Sisters of the Diaspora"
                        value={newProject.title}
                        onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="genre">Genre</Label>
                      <Input
                        id="genre"
                        value={newProject.genre}
                        onChange={(e) => setNewProject({...newProject, genre: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mood">Mood</Label>
                      <Input
                        id="mood"
                        value={newProject.mood}
                        onChange={(e) => setNewProject({...newProject, mood: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="theme">Theme</Label>
                      <Input
                        id="theme"
                        value={newProject.theme}
                        onChange={(e) => setNewProject({...newProject, theme: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your show concept..."
                      value={newProject.description}
                      onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <Button onClick={createProject} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Project
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Projects */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <Card
                    key={project.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedProject === project.id ? 'border-primary ring-2 ring-primary/20' : ''
                    }`}
                    onClick={() => setSelectedProject(project.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{project.title}</CardTitle>
                          <CardDescription className="line-clamp-2 mt-1">
                            {project.description}
                          </CardDescription>
                        </div>
                        <Badge variant={project.status === 'published' ? 'default' : 'secondary'}>
                          {project.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{project.genre}</Badge>
                        <Badge variant="outline">{project.mood}</Badge>
                        <Badge variant="outline">{project.theme}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Episodes Tab */}
            <TabsContent value="episodes" className="space-y-6">
              {currentProject ? (
                <>
                  {/* Realism Audit */}
                  <RealismAudit
                    totalEpisodes={episodes.length}
                    photorealisticCount={episodes.filter((e: any) => e.rendering_style === 'photorealistic').length}
                    stylizedCount={episodes.filter((e: any) => e.rendering_style === 'stylized').length}
                  />

                  {/* Episode Renderers */}
                  <div className="grid grid-cols-1 gap-4">
                    {episodes.map((episode) => (
                      <VideoRenderer
                        key={episode.id}
                        episode={episode as any}
                        onStatusChange={() => fetchProjectDetails(selectedProject!)}
                      />
                    ))}
                    {episodes.length === 0 && (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <Clapperboard className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                          <p className="text-muted-foreground">No episodes yet. Use the AI copilot to create episodes!</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Select a project to view episodes</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Cast Tab */}
            <TabsContent value="cast" className="space-y-6">
              {currentProject ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Cast for {currentProject.title}</CardTitle>
                    <CardDescription>
                      {characters.length} character{characters.length !== 1 ? 's' : ''} defined
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {characters.map((character) => (
                        <div
                          key={character.id}
                          className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-accent/10">
                              <Users className="h-5 w-5 text-accent" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{character.name}</h4>
                              <p className="text-sm text-muted-foreground mb-2">{character.role}</p>
                              <p className="text-xs text-foreground/60 line-clamp-2">
                                {character.personality}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {characters.length === 0 && (
                        <div className="col-span-2 text-center py-8 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No cast members yet. Add characters to your project!</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Select a project to view cast</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Bot Automation Tab */}
            <TabsContent value="automation" className="space-y-6">
              {currentProject ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Automated Content Pipeline</CardTitle>
                      <CardDescription>
                        Trigger AI bots to generate and distribute content for {currentProject.title}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                          variant="outline"
                          className="h-auto flex-col items-start p-4"
                          onClick={() => triggerBotPipeline("Script Generator")}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <span className="font-semibold">Generate Scripts</span>
                          </div>
                          <p className="text-xs text-muted-foreground text-left">
                            Create viral scripts and episode outlines
                          </p>
                        </Button>

                        <Button
                          variant="outline"
                          className="h-auto flex-col items-start p-4"
                          onClick={() => triggerBotPipeline("Trend Detection")}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-5 w-5 text-accent" />
                            <span className="font-semibold">Detect Trends</span>
                          </div>
                          <p className="text-xs text-muted-foreground text-left">
                            Find trending topics to inject into content
                          </p>
                        </Button>

                        <Button
                          variant="outline"
                          className="h-auto flex-col items-start p-4"
                          onClick={() => triggerBotPipeline("Cross-Platform Poster")}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Upload className="h-5 w-5 text-primary-glow" />
                            <span className="font-semibold">Post Content</span>
                          </div>
                          <p className="text-xs text-muted-foreground text-left">
                            Schedule and distribute across all platforms
                          </p>
                        </Button>

                        <Button
                          variant="outline"
                          className="h-auto flex-col items-start p-4"
                          onClick={() => triggerBotPipeline("Performance Tracker")}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="h-5 w-5 text-accent" />
                            <span className="font-semibold">Track Performance</span>
                          </div>
                          <p className="text-xs text-muted-foreground text-left">
                            Monitor metrics and optimize strategy
                          </p>
                        </Button>
                      </div>

                      <div className="pt-4 border-t">
                        <Button
                          className="w-full bg-gradient-to-r from-primary to-accent"
                          onClick={() => {
                            triggerBotPipeline("Script Generator");
                            setTimeout(() => triggerBotPipeline("Cross-Platform Poster"), 1000);
                            setTimeout(() => triggerBotPipeline("Performance Tracker"), 2000);
                          }}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Run Full Pipeline
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Select a project to activate bots</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Workflow;
