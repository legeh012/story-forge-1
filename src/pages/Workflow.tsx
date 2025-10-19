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
  Upload, Settings, BarChart3, Loader2, Download, Paperclip, X, Trash2, UserPlus
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VideoRenderer } from "@/components/VideoRenderer";
import { RealismAudit } from "@/components/RealismAudit";
import { ActiveBotsPanel } from "@/components/ActiveBotsPanel";
import { ScalabilityInfo } from "@/components/ScalabilityInfo";
import { sayWalahiCharacters } from "@/data/sayWalahiCharacters";

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

interface GenerationAttachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  description: string | null;
  created_at: string;
  project_id: string | null;
  episode_id: string | null;
}

const Workflow = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [attachments, setAttachments] = useState<GenerationAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [creatingCharacter, setCreatingCharacter] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  
  // New character form state
  const [newCharacter, setNewCharacter] = useState({
    name: "",
    role: "",
    personality: "",
    background: "",
    goals: "",
    age: ""
  });
  
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
      const [episodesRes, charactersRes, attachmentsRes] = await Promise.all([
        supabase.from("episodes").select("*").eq("project_id", projectId).order("episode_number"),
        supabase.from("characters").select("*").eq("project_id", projectId),
        supabase.from("generation_attachments").select("*").eq("project_id", projectId).order("created_at", { ascending: false })
      ]);

      setEpisodes(episodesRes.data || []);
      setCharacters(charactersRes.data || []);
      setAttachments(attachmentsRes.data || []);
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

  const handleImportTemplate = async () => {
    if (!selectedProject) {
      toast({
        title: "Project required",
        description: "Please select a project first",
        variant: "destructive"
      });
      return;
    }

    setImporting(true);

    try {
      const { data, error } = await supabase.functions.invoke('import-characters', {
        body: { characters: sayWalahiCharacters, projectId: selectedProject }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Say Walahi cast imported!",
          description: `${data.imported} characters added to your project`,
        });
        await fetchProjectDetails(selectedProject);
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import characters",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProject || !event.target.files || event.target.files.length === 0) return;

    setUploading(true);
    const file = event.target.files[0];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${selectedProject}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('generation-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('generation-attachments')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('generation_attachments')
        .insert([{
          user_id: user.id,
          project_id: selectedProject,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          file_type: file.type
        }]);

      if (dbError) throw dbError;

      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully`
      });

      await fetchProjectDetails(selectedProject);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleDownload = async (attachment: GenerationAttachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('generation-attachments')
        .download(attachment.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: `Downloading ${attachment.file_name}`
      });
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteAttachment = async (attachmentId: string, filePath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('generation-attachments')
        .remove([filePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('generation_attachments')
        .delete()
        .eq('id', attachmentId);

      if (dbError) throw dbError;

      toast({
        title: "File deleted",
        description: "Attachment removed successfully"
      });

      if (selectedProject) {
        await fetchProjectDetails(selectedProject);
      }
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const handleCreateCharacter = async () => {
    if (!selectedProject) {
      toast({
        title: "Project required",
        description: "Please select a project first",
        variant: "destructive"
      });
      return;
    }

    if (!newCharacter.name || !newCharacter.role) {
      toast({
        title: "Missing fields",
        description: "Name and role are required",
        variant: "destructive"
      });
      return;
    }

    setCreatingCharacter(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("characters")
        .insert([{
          user_id: user.id,
          project_id: selectedProject,
          name: newCharacter.name,
          role: newCharacter.role,
          personality: newCharacter.personality,
          background: newCharacter.background,
          goals: newCharacter.goals,
          age: newCharacter.age ? parseInt(newCharacter.age) : null
        }]);

      if (error) throw error;

      toast({
        title: "Character created!",
        description: `${newCharacter.name} has been added to your cast`
      });

      setNewCharacter({
        name: "",
        role: "",
        personality: "",
        background: "",
        goals: "",
        age: ""
      });

      await fetchProjectDetails(selectedProject);
    } catch (error: any) {
      toast({
        title: "Error creating character",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCreatingCharacter(false);
    }
  };

  const handleDeleteCharacter = async (characterId: string) => {
    if (!selectedProject) return;

    try {
      const { error } = await supabase
        .from("characters")
        .delete()
        .eq("id", characterId);

      if (error) throw error;

      toast({
        title: "Character deleted",
        description: "Character removed from cast"
      });

      await fetchProjectDetails(selectedProject);
    } catch (error: any) {
      toast({
        title: "Delete failed",
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="episodes">Episodes</TabsTrigger>
              <TabsTrigger value="cast">Cast</TabsTrigger>
              <TabsTrigger value="bots">Active Bots</TabsTrigger>
              <TabsTrigger value="automation">Automation</TabsTrigger>
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
                <>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Cast for {currentProject.title}</CardTitle>
                          <CardDescription>
                            {characters.length} character{characters.length !== 1 ? 's' : ''} defined
                          </CardDescription>
                        </div>
                        <Button
                          onClick={handleImportTemplate}
                          disabled={importing}
                          variant="outline"
                          className="border-accent/30 hover:bg-accent/10"
                        >
                          {importing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Importing...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Load Say Walahi Cast
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Create Character Form */}
                      <div className="p-4 border rounded-lg bg-accent/5">
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <UserPlus className="h-4 w-4" />
                          Add New Character
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="char-name">Name *</Label>
                            <Input
                              id="char-name"
                              placeholder="Character name"
                              value={newCharacter.name}
                              onChange={(e) => setNewCharacter({...newCharacter, name: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="char-role">Role *</Label>
                            <Input
                              id="char-role"
                              placeholder="e.g., Protagonist, Villain"
                              value={newCharacter.role}
                              onChange={(e) => setNewCharacter({...newCharacter, role: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="char-age">Age</Label>
                            <Input
                              id="char-age"
                              type="number"
                              placeholder="Age"
                              value={newCharacter.age}
                              onChange={(e) => setNewCharacter({...newCharacter, age: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="char-personality">Personality</Label>
                            <Input
                              id="char-personality"
                              placeholder="Brief personality traits"
                              value={newCharacter.personality}
                              onChange={(e) => setNewCharacter({...newCharacter, personality: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="char-background">Background</Label>
                            <Textarea
                              id="char-background"
                              placeholder="Character backstory..."
                              value={newCharacter.background}
                              onChange={(e) => setNewCharacter({...newCharacter, background: e.target.value})}
                              rows={2}
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="char-goals">Goals</Label>
                            <Textarea
                              id="char-goals"
                              placeholder="What does this character want?"
                              value={newCharacter.goals}
                              onChange={(e) => setNewCharacter({...newCharacter, goals: e.target.value})}
                              rows={2}
                            />
                          </div>
                        </div>
                        <Button 
                          onClick={handleCreateCharacter} 
                          disabled={creatingCharacter || !newCharacter.name || !newCharacter.role}
                          className="w-full mt-4"
                        >
                          {creatingCharacter ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Character
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Characters List */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {characters.map((character) => (
                          <div
                            key={character.id}
                            className="p-4 border rounded-lg hover:shadow-md transition-shadow relative group"
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteCharacter(character.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-full bg-accent/10">
                                <Users className="h-5 w-5 text-accent" />
                              </div>
                              <div className="flex-1 pr-8">
                                <h4 className="font-semibold">{character.name}</h4>
                                <p className="text-sm text-muted-foreground mb-2">{character.role}</p>
                                {character.personality && (
                                  <p className="text-xs text-foreground/60 line-clamp-2">
                                    {character.personality}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {characters.length === 0 && (
                          <div className="col-span-2 text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No cast members yet. Add characters above or import a template!</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Generation Attachments */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Generation Attachments</CardTitle>
                          <CardDescription>
                            Upload and manage files for your generations ({attachments.length} file{attachments.length !== 1 ? 's' : ''})
                          </CardDescription>
                        </div>
                        <div>
                          <Input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={uploading}
                          />
                          <Button
                            onClick={() => document.getElementById('file-upload')?.click()}
                            disabled={uploading}
                            variant="outline"
                          >
                            {uploading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Paperclip className="h-4 w-4 mr-2" />
                                Upload File
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <FileText className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{attachment.file_name}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{formatFileSize(attachment.file_size)}</span>
                                  <span>•</span>
                                  <span>{new Date(attachment.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDownload(attachment)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteAttachment(attachment.id, attachment.file_path)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {attachments.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Paperclip className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No attachments yet. Upload files to get started!</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Select a project to view cast</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Active Bots Tab */}
            <TabsContent value="bots" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Active Production Bots</CardTitle>
                  <CardDescription>
                    AI-powered automation for instant, cinematic reality TV production
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ActiveBotsPanel episodeId={currentProject?.id} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bot Automation Tab */}
            <TabsContent value="automation" className="space-y-6">
              {currentProject ? (
                <>
                  <ScalabilityInfo />
                  
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
