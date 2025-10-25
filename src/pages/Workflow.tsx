import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Play, Pause, Video, Users, FileText, TrendingUp, Film, Upload, Image as ImageIcon,
  Clapperboard, Sparkles, Clock, CheckCircle2, AlertCircle,
  Settings, BarChart3, Loader2, Download, Paperclip, X, Trash2, UserPlus, Save, FolderOpen
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VideoRenderer } from "@/components/VideoRenderer";
import { RealismAudit } from "@/components/RealismAudit";
import { ActiveBotsPanel } from "@/components/ActiveBotsPanel";
import { ScalabilityInfo } from "@/components/ScalabilityInfo";
import { PromptGenerator } from "@/components/PromptGenerator";
import { ProductionDashboard } from "@/components/ProductionDashboard";
import { EpisodeWorkflowPipeline } from "@/components/EpisodeWorkflowPipeline";
import { ArtlistAdvancedPanel } from "@/components/ArtlistAdvancedPanel";
import { SunoMusicStudio } from "@/components/SunoMusicStudio";
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
  const [importingFromPhotos, setImportingFromPhotos] = useState(false);
  
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
  const [producingEpisodes, setProducingEpisodes] = useState(false);
  
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

      if (error) {
        console.error('Import error:', error);
        throw error;
      }

      if (data?.success) {
        toast({
          title: "Say Walahi cast imported!",
          description: `${data.imported} characters added to your project`,
        });
        await fetchProjectDetails(selectedProject);
      } else {
        throw new Error(data?.error || 'Import failed');
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import characters",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const handleImportFromPhotos = async () => {
    if (!selectedProject) {
      toast({
        title: "No Project Selected",
        description: "Please select a project first",
        variant: "destructive"
      });
      return;
    }

    setImportingFromPhotos(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-from-photos', {
        body: { projectId: selectedProject }
      });

      if (error) throw error;

      toast({
        title: "🎭 Characters Imported!",
        description: `Created ${data.imported} characters from ${data.total_images} photos`,
      });

      // Refresh characters
      await fetchProjectDetails(selectedProject);

    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import from photos",
        variant: "destructive"
      });
    } finally {
      setImportingFromPhotos(false);
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
    const files = Array.from(event.target.files);
    const totalFiles = files.length;
    let successCount = 0;
    let failCount = 0;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload all files in parallel
      await Promise.all(
        files.map(async (file) => {
          try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${selectedProject}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
              .from('generation-attachments')
              .upload(fileName, file);

            if (uploadError) throw uploadError;

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
            successCount++;
          } catch (error) {
            console.error(`Failed to upload ${file.name}:`, error);
            failCount++;
          }
        })
      );

      if (successCount > 0) {
        toast({
          title: `${successCount} file${successCount > 1 ? 's' : ''} uploaded`,
          description: failCount > 0 
            ? `${failCount} file${failCount > 1 ? 's' : ''} failed to upload`
            : "All files uploaded successfully"
        });
        await fetchProjectDetails(selectedProject);
      } else {
        throw new Error("All uploads failed");
      }
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

  const handleSaveCharacters = () => {
    if (characters.length === 0) {
      toast({
        title: "No characters to save",
        description: "Add some characters first",
        variant: "destructive"
      });
      return;
    }

    const dataStr = JSON.stringify(characters, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentProject?.title || 'characters'}_cast.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Characters exported",
      description: `${characters.length} character${characters.length !== 1 ? 's' : ''} saved to file`
    });
  };

  const handleLoadCharacters = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProject || !event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    if (file.type !== 'application/json') {
      toast({
        title: "Invalid file type",
        description: "Please upload a JSON file",
        variant: "destructive"
      });
      return;
    }

    try {
      const text = await file.text();
      const importedCharacters = JSON.parse(text);

      if (!Array.isArray(importedCharacters)) {
        throw new Error("Invalid format: expected an array of characters");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Prepare characters for insertion
      const charactersToInsert = importedCharacters.map((char: any) => ({
        user_id: user.id,
        project_id: selectedProject,
        name: char.name,
        role: char.role || '',
        personality: char.personality || '',
        background: char.background || '',
        goals: char.goals || '',
        age: char.age || null,
        metadata: char.metadata || {},
        relationships: char.relationships || []
      }));

      const { error } = await supabase
        .from("characters")
        .insert(charactersToInsert);

      if (error) throw error;

      toast({
        title: "Characters imported!",
        description: `${charactersToInsert.length} character${charactersToInsert.length !== 1 ? 's' : ''} added to your cast`
      });

      await fetchProjectDetails(selectedProject);
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      if (event.target) event.target.value = '';
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

  const handleAutoProduceAllEpisodes = async () => {
    if (!selectedProject || episodes.length === 0) {
      toast({
        title: "No episodes to produce",
        description: "Create some episodes first",
        variant: "destructive"
      });
      return;
    }

    setProducingEpisodes(true);

    try {
      toast({
        title: "Starting bot production",
        description: `Processing ${episodes.length} episode(s) with all AI bots...`
      });

      // Process each episode
      for (const episode of episodes) {
        const { data, error } = await supabase.functions.invoke('episode-producer', {
          body: {
            episodeId: episode.id,
            projectId: selectedProject
          }
        });

        if (error) {
          console.error(`Episode ${episode.title} production error:`, error);
          toast({
            title: `Error producing ${episode.title}`,
            description: error.message,
            variant: "destructive"
          });
        } else if (data) {
          toast({
            title: `${episode.title} produced!`,
            description: `Success rate: ${Math.round(data.successRate)}% - ${data.readyForVideo ? 'Ready for video rendering' : 'Needs review'}`
          });
        }
      }

      toast({
        title: "Production complete!",
        description: "All episodes have been processed by the AI bots"
      });

      await fetchProjectDetails(selectedProject);
    } catch (error: any) {
      toast({
        title: "Production failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setProducingEpisodes(false);
    }
  };

  const handleGenerateCustomEpisode = async (customDetails: any) => {
    if (!selectedProject) {
      toast({
        title: "No project selected",
        description: "Please select a project first",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "🎬 Generating Custom Episode",
        description: "Creating episode with your cast and details...",
      });

      const { data, error } = await supabase.functions.invoke('generate-episode-from-prompt', {
        body: {
          projectId: selectedProject,
          prompt: customDetails.prompt,
          duration: customDetails.duration || 180,
          customCast: customDetails.cast,
          episodeMetadata: customDetails.metadata
        }
      });

      if (error) throw error;

      toast({
        title: "✅ Episode Generated!",
        description: `"${customDetails.title}" is ready for production`,
      });

      await fetchProjectDetails(selectedProject);
      
      // Navigate to the episode detail page
      if (data?.episode?.id) {
        navigate(`/episodes/${data.episode.id}`);
      }
    } catch (error: any) {
      toast({
        title: "Generation failed",
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
              {projects.length > 0 ? (
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
                              {project.description || 'No description'}
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
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No projects yet. Create your first project above!</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Episodes Tab */}
            <TabsContent value="episodes" className="space-y-6">
              {currentProject ? (
                <>
                  {/* Production Dashboard */}
                  <ProductionDashboard
                    stats={{
                      totalEpisodes: episodes.length,
                      renderingEpisodes: episodes.filter((e: any) => e.video_status === 'rendering').length,
                      completedEpisodes: episodes.filter((e: any) => e.video_status === 'completed').length,
                      failedEpisodes: episodes.filter((e: any) => e.video_status === 'failed').length,
                    }}
                  />

                  {/* AI Prompt Generator */}
                  <PromptGenerator 
                    projectId={selectedProject!}
                    onEpisodeGenerated={() => fetchProjectDetails(selectedProject!)}
                  />

                  {/* Quick Custom Episode Generator */}
                  <Card className="bg-gradient-to-r from-accent/10 to-primary/10 border-accent/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clapperboard className="h-5 w-5 text-accent" />
                        Quick Episode Generator
                      </CardTitle>
                      <CardDescription>
                        Generate "Khat & Karma: The Baby Daddy Blowout" with custom cast
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => handleGenerateCustomEpisode({
                          title: "Khat & Karma: The Baby Daddy Blowout",
                          prompt: `Create an explosive reality TV episode titled "Khat & Karma: The Baby Daddy Blowout" with the following cast:

Luul – The Quiet Storm: Soft-spoken but savage. Doesn't talk much… until she drops a voice note that exposes Zahra's cheating husband. Wears niqab and AirPods. Her silence is louder than the slap.

Luckiee / DJLuckLuck – Narrator, Remix Trigger, Chaos Conductor: Drops "I'm Better Than You" mid-fight. Controls overlays, Somali word triggers, and emotional arcs. Her beats slap harder than Zahra's denial.

Ayaan – The Enforcer: Eldest sister. Khat dealer. Has three baby daddies and a burner phone for each. Slaps Jamaal with a hookah hose and says "Warya, I built this house!"

Zahra – The Denier: Married to Abdi the cheater. Caught him texting "Habibti" to three girls and a cousin. Still says "They're just friends" while crying in full glam.

Amal – The Academic: Law student. Tries to mediate but ends up leaking burner texts. Says "I'm just being honest" before flipping the table and quoting Somali proverbs.

Ifrah – The Cryer: Pregnant. Doesn't know who the baby daddy is. Drops a fake paternity test during dinner. Cries every 12 minutes. Her tears trigger overlays.

Hani – The Shade Queen: Cousin. Doesn't live in the house but shows up to stir drama. Says "I heard what you said about me" and throws tea. Her entrance cue is "Fadhiiso!" in neon.

The episode should feature maximum drama, cultural authenticity, viral moments, and reality TV chaos. Budget: $9,000. Legacy Impact: Viral in 3 diasporas, 2 remix tracks, 1 auntie boycott, 1 baby daddy redemption arc.`,
                          duration: 180,
                          cast: [
                            { name: "Luul", role: "The Quiet Storm", description: "Soft-spoken but savage" },
                            { name: "Luckiee", role: "Narrator & DJ", description: "Chaos conductor" },
                            { name: "Ayaan", role: "The Enforcer", description: "Eldest sister, khat dealer" },
                            { name: "Zahra", role: "The Denier", description: "Married to a cheater" },
                            { name: "Amal", role: "The Academic", description: "Law student mediator" },
                            { name: "Ifrah", role: "The Cryer", description: "Pregnant with mystery daddy" },
                            { name: "Hani", role: "The Shade Queen", description: "Drama catalyst cousin" }
                          ],
                          metadata: {
                            budget: 9000,
                            legacyImpact: "Viral in 3 diasporas, 2 remix tracks, 1 auntie boycott, 1 baby daddy redemption arc"
                          }
                        })}
                        className="w-full bg-gradient-to-r from-accent to-primary"
                        size="lg"
                      >
                        <Play className="mr-2 h-5 w-5" />
                        Generate "Khat & Karma" Episode
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Realism Audit */}
                  <RealismAudit
                    totalEpisodes={episodes.length}
                    photorealisticCount={episodes.filter((e: any) => e.rendering_style === 'photorealistic').length}
                    stylizedCount={episodes.filter((e: any) => e.rendering_style === 'stylized').length}
                  />

                  {/* Auto-Produce Episodes Button */}
                  {episodes.length > 0 && (
                    <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary-glow/10 border-primary/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          AI Bot Production System
                        </CardTitle>
                        <CardDescription>
                          Activate all bots to produce episodes with scripts, cultural elements, expert direction, and optimized hooks
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          onClick={handleAutoProduceAllEpisodes}
                          disabled={producingEpisodes}
                          className="w-full"
                        >
                          {producingEpisodes ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Producing Episodes...
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              Auto-Produce All Episodes
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Episode Workflow Pipelines */}
                  <div className="grid grid-cols-1 gap-6">
                    {episodes.map((episode: any) => (
                      <EpisodeWorkflowPipeline
                        key={episode.id}
                        episodeId={episode.id}
                        episodeTitle={episode.title}
                        episodeStatus={episode.status}
                        videoStatus={episode.video_status}
                        script={episode.script}
                        voiceGenerated={!!episode.script}
                        scenesGenerated={!!episode.storyboard && Array.isArray(episode.storyboard) && episode.storyboard.length > 0}
                        videoUrl={episode.video_url}
                        onGenerateScript={async () => {
                          toast({ title: "Generating Script", description: "AI is writing the episode script..." });
                          const { error } = await supabase.functions.invoke('script-generator-bot', {
                            body: { episodeId: episode.id }
                          });
                          if (!error) {
                            toast({ title: "Script Generated!", description: "Episode script is ready" });
                            fetchProjectDetails(selectedProject!);
                          }
                        }}
                        onGenerateVoice={async () => {
                          toast({ title: "Generating Voice", description: "Creating voice-over for the episode..." });
                          const { error } = await supabase.functions.invoke('godlike-voice-bot', {
                            body: { episodeId: episode.id }
                          });
                          if (!error) {
                            toast({ title: "Voice Generated!", description: "Voice-over is ready" });
                            fetchProjectDetails(selectedProject!);
                          }
                        }}
                        onGenerateScenes={async () => {
                          toast({ title: "Generating Scenes", description: "Creating visual scenes..." });
                          const { error } = await supabase.functions.invoke('scene-orchestration', {
                            body: { episodeId: episode.id }
                          });
                          if (!error) {
                            toast({ title: "Scenes Generated!", description: "All scenes are ready" });
                            fetchProjectDetails(selectedProject!);
                          }
                        }}
                        onStartRender={async () => {
                          toast({ title: "Starting Render", description: "Video rendering has begun..." });
                          const { error } = await supabase.functions.invoke('render-episode-video', {
                            body: { episodeId: episode.id }
                          });
                          if (!error) {
                            toast({ title: "Rendering Started!", description: "Check back soon for completed video" });
                            fetchProjectDetails(selectedProject!);
                          }
                        }}
                        onDownload={async () => {
                          if (episode.video_url) {
                            window.open(episode.video_url, '_blank');
                            toast({ title: "Opening Video", description: "Video opened in new tab" });
                          }
                        }}
                        onPublish={async () => {
                          const { error } = await supabase
                            .from('episodes')
                            .update({ status: 'published' })
                            .eq('id', episode.id);
                          
                          if (!error) {
                            toast({ title: "Published!", description: "Episode is now live" });
                            fetchProjectDetails(selectedProject!);
                          }
                        }}
                      />
                    ))}
                    {episodes.length === 0 && (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <Clapperboard className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                          <p className="text-muted-foreground">No episodes yet. Use the AI generator to create episodes!</p>
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
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSaveCharacters}
                            disabled={characters.length === 0}
                            variant="outline"
                            size="sm"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Export Cast
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('character-file-input')?.click()}
                          >
                            <FolderOpen className="h-4 w-4 mr-2" />
                            Import Cast
                          </Button>
                          <input
                            id="character-file-input"
                            type="file"
                            accept="application/json"
                            onChange={handleLoadCharacters}
                            className="hidden"
                          />
                          <Button
                            onClick={handleImportFromPhotos}
                            disabled={importingFromPhotos || attachments.length === 0}
                            variant="default"
                            size="sm"
                            className="bg-gradient-to-r from-primary to-accent mr-2"
                          >
                            {importingFromPhotos ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Import from Photos ({attachments.length})
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={handleImportTemplate}
                            disabled={importing}
                            variant="outline"
                            size="sm"
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
                                Say Walahi Cast
                              </>
                            )}
                          </Button>
                        </div>
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
                            multiple
                            accept="image/*,video/*,application/pdf,.doc,.docx,.txt"
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
                                Upload Files
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
              <SunoMusicStudio projectId={selectedProject || undefined} episodeId={selectedProject || undefined} />
              
              <ArtlistAdvancedPanel episodeId={selectedProject || undefined} />
              
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
