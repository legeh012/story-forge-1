import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Play, Edit2, Save, ExternalLink, Users, MapPin, Music, Clock, Film } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { EpisodeVideoPlayer } from "@/components/EpisodeVideoPlayer";
import { VideoManifestPlayer } from "@/components/VideoManifestPlayer";
import { FFmpegVideoRenderer } from "@/components/FFmpegVideoRenderer";

interface Episode {
  id: string;
  title: string;
  episode_number: number;
  season: number;
  synopsis: string;
  script: string;
  status: string;
  video_status: string;
  video_url: string | null;
  video_manifest_url?: string | null;
  storyboard?: any;
  project_id: string;
  created_at: string;
  updated_at: string;
}

// --- Sub-components ---

const SceneCard = ({ scene, index }: { scene: any; index: number }) => {
  const emotionColors: Record<string, string> = {
    anger: 'bg-destructive/20 text-destructive',
    joy: 'bg-green-500/20 text-green-400',
    tension: 'bg-yellow-500/20 text-yellow-400',
    sadness: 'bg-blue-500/20 text-blue-400',
    excitement: 'bg-primary/20 text-primary',
    fear: 'bg-purple-500/20 text-purple-400',
    love: 'bg-pink-500/20 text-pink-400',
  };

  return (
    <div className="flex gap-4 p-4 rounded-lg bg-background/50 border border-border/30">
      <div className="flex flex-col items-center gap-1 shrink-0">
        <span className="text-xs font-mono text-muted-foreground">SCENE</span>
        <span className="text-2xl font-black text-primary/50">{scene.scene_number || index + 1}</span>
        {scene.duration_seconds && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />{scene.duration_seconds}s
          </span>
        )}
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          {scene.location && (
            <Badge variant="outline" className="text-xs gap-1">
              <MapPin className="h-3 w-3" />{scene.location}
            </Badge>
          )}
          {scene.emotion && (
            <Badge className={`text-xs ${emotionColors[scene.emotion] || 'bg-muted'}`}>
              {scene.emotion}
            </Badge>
          )}
        </div>
        <p className="text-sm">{scene.description || scene.action || 'No description'}</p>
        {scene.characters?.length > 0 && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />{scene.characters.join(', ')}
          </p>
        )}
        {scene.music_cue && (
          <p className="text-xs text-accent/70 flex items-center gap-1">
            <Music className="h-3 w-3" />{scene.music_cue}
          </p>
        )}
      </div>
    </div>
  );
};

const CastCard = ({ character }: { character: any }) => {
  const roleColors: Record<string, string> = {
    protagonist: 'bg-primary',
    antagonist: 'bg-destructive',
    wildcard: 'bg-yellow-500',
    peacemaker: 'bg-green-500',
  };

  return (
    <Card className="border-border/50">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-bold">{character.name}</h4>
          <Badge className={roleColors[character.role] || 'bg-muted'} variant="secondary">
            {character.role}
          </Badge>
        </div>
        {character.personality && <p className="text-sm text-muted-foreground">{character.personality}</p>}
        {character.metadata?.voice_style && (
          <p className="text-xs italic text-primary/70">🎙 {character.metadata.voice_style}</p>
        )}
      </CardContent>
    </Card>
  );
};

// --- Main Component ---

const EpisodeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editedEpisode, setEditedEpisode] = useState<Partial<Episode>>({});
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth'); return; }
      if (id) fetchEpisode(id);
    };
    checkAuth();
  }, [id, navigate]);

  const fetchEpisode = async (episodeId: string) => {
    try {
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('id', episodeId)
        .single();
      if (error) throw error;
      setEpisode(data as unknown as Episode);
      setEditedEpisode(data as unknown as Episode);

      // Fetch cast for this project
      if (data.project_id) {
        const { data: chars } = await supabase
          .from('characters')
          .select('*')
          .eq('project_id', data.project_id)
          .order('name');
        setCharacters(chars || []);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load episode", variant: "destructive" });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!episode) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('episodes').update(editedEpisode).eq('id', episode.id);
      if (error) throw error;
      setEpisode({ ...episode, ...editedEpisode });
      setIsEditing(false);
      toast({ title: "Saved", description: "Episode updated." });
    } catch {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!episode) return;
    setIsGenerating(true);
    try {
      const { error } = await supabase.functions.invoke('generate-video', {
        body: { episodeId: episode.id }
      });
      if (error) throw error;
      toast({ title: "🎬 Generation Started", description: "Video pipeline is processing your episode." });
      // Poll for completion
      const poll = setInterval(async () => {
        const { data } = await supabase
          .from('episodes')
          .select('video_status, video_url')
          .eq('id', episode.id)
          .single();
        if (data?.video_status === 'completed' || data?.video_status === 'failed') {
          clearInterval(poll);
          setEpisode({ ...episode, ...data });
          if (data.video_status === 'completed') {
            setIsPlayerOpen(true);
            toast({ title: "🎬 Video Ready!", description: "Your episode is ready to watch." });
          }
        }
      }, 5000);
      setTimeout(() => clearInterval(poll), 300000);
    } catch {
      toast({ title: "Error", description: "Failed to start generation", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!episode) return <div className="flex items-center justify-center min-h-screen">Episode not found</div>;

  const storyboard = Array.isArray(episode.storyboard) ? episode.storyboard : [];

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-muted', in_progress: 'bg-blue-500', completed: 'bg-green-500', published: 'bg-primary'
    };
    return colors[status] || 'bg-muted';
  };

  const getVideoStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      not_started: 'bg-muted', rendering: 'bg-yellow-500', processing: 'bg-yellow-500',
      completed: 'bg-green-500', failed: 'bg-destructive'
    };
    return colors[status] || 'bg-muted';
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-5xl mx-auto">
          {/* Back */}
          <div className="mb-6">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard
              </Button>
            </Link>
          </div>

          {/* Title */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {isEditing ? (
                  <Input
                    value={editedEpisode.title || ''}
                    onChange={(e) => setEditedEpisode({ ...editedEpisode, title: e.target.value })}
                    className="text-4xl font-bold"
                  />
                ) : episode.title}
              </h1>
              <p className="text-muted-foreground text-lg">Season {episode.season}, Episode {episode.episode_number}</p>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />{isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="outline" onClick={() => { setIsEditing(false); setEditedEpisode(episode); }}>Cancel</Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />Edit
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-6">
            {/* Status + Video */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Episode Status</CardTitle>
                  <div className="flex gap-2">
                    <Badge className={getStatusBadge(episode.status)}>{episode.status}</Badge>
                    <Badge className={getVideoStatusBadge(episode.video_status)}>
                      Video: {episode.video_status?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {episode.video_url && (
                  <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${episode.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/)?.[1] || episode.video_url}`}
                      title={episode.title}
                      className="absolute top-0 left-0 w-full h-full rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  {episode.video_url ? (
                    <>
                      <Button onClick={() => setIsPlayerOpen(true)}>
                        <Play className="h-4 w-4 mr-2" />Play Video
                      </Button>
                      <Button variant="outline" asChild>
                        <a href={episode.video_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />Open in YouTube
                        </a>
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleGenerate} disabled={isGenerating}>
                      <Play className="h-4 w-4 mr-2" />
                      {isGenerating ? 'Generating...' : 'Generate Video'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Cast */}
            {characters.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Cast ({characters.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {characters.map((char) => <CastCard key={char.id} character={char} />)}
                </div>
              </div>
            )}

            {/* Scene Breakdown */}
            {storyboard.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Film className="h-5 w-5 text-accent" />
                    Scene Breakdown ({storyboard.length} scenes)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {storyboard.map((scene, i) => (
                    <SceneCard key={i} scene={scene} index={i} />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Synopsis */}
            <Card>
              <CardHeader><CardTitle>Synopsis</CardTitle></CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editedEpisode.synopsis || ''}
                    onChange={(e) => setEditedEpisode({ ...editedEpisode, synopsis: e.target.value })}
                    className="min-h-32"
                  />
                ) : (
                  <p className="text-muted-foreground">{episode.synopsis || 'No synopsis available'}</p>
                )}
              </CardContent>
            </Card>

            {/* Script */}
            <Card>
              <CardHeader><CardTitle>Script</CardTitle></CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editedEpisode.script || ''}
                    onChange={(e) => setEditedEpisode({ ...editedEpisode, script: e.target.value })}
                    className="min-h-96 font-mono"
                  />
                ) : (
                  <pre className="whitespace-pre-wrap font-mono text-sm text-muted-foreground">
                    {episode.script || 'No script available'}
                  </pre>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <EpisodeVideoPlayer
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
        videoUrl={episode?.video_url || null}
        episodeTitle={episode?.title}
        episodeNumber={episode?.episode_number}
        season={episode?.season}
        autoPlay={true}
      />
    </div>
  );
};

export default EpisodeDetail;
