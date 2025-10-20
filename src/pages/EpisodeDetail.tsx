import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Play, Download, Edit2, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { VideoManifestPlayer } from "@/components/VideoManifestPlayer";

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
  created_at: string;
  updated_at: string;
}

const EpisodeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editedEpisode, setEditedEpisode] = useState<Partial<Episode>>({});

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      if (id) {
        fetchEpisode(id);
      }
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
      setEpisode(data);
      setEditedEpisode(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load episode",
        variant: "destructive",
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!episode) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('episodes')
        .update(editedEpisode)
        .eq('id', episode.id);

      if (error) throw error;

      setEpisode({ ...episode, ...editedEpisode });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Episode updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save episode",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!episode) return;

    setIsGenerating(true);
    try {
      const { error } = await supabase.functions.invoke('ultra-video-bot', {
        body: { 
          episodeId: episode.id,
          enhancementLevel: 'ultra'
        }
      });

      if (error) throw error;

      toast({
        title: "Generation Started",
        description: "Ultra Video Bot is processing your episode",
      });

      // Refresh episode data
      fetchEpisode(episode.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start generation",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!episode) {
    return <div className="flex items-center justify-center min-h-screen">Episode not found</div>;
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-muted',
      in_progress: 'bg-blue-500',
      completed: 'bg-success',
      published: 'bg-primary'
    };
    return colors[status] || 'bg-muted';
  };

  const getVideoStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      not_started: 'bg-muted',
      rendering: 'bg-yellow-500',
      completed: 'bg-success',
      failed: 'bg-destructive'
    };
    return colors[status] || 'bg-muted';
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  {isEditing ? (
                    <Input
                      value={editedEpisode.title || ''}
                      onChange={(e) => setEditedEpisode({ ...editedEpisode, title: e.target.value })}
                      className="text-4xl font-bold"
                    />
                  ) : (
                    episode.title
                  )}
                </h1>
                <p className="text-muted-foreground text-lg">
                  Season {episode.season}, Episode {episode.episode_number}
                </p>
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave} disabled={isSaving}>
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIsEditing(false);
                      setEditedEpisode(episode);
                    }}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Episode Status</CardTitle>
                  <div className="flex gap-2">
                    <Badge className={getStatusBadge(episode.status)}>
                      {episode.status}
                    </Badge>
                    <Badge className={getVideoStatusBadge(episode.video_status)}>
                      Video: {episode.video_status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {episode.video_url && (
                  <div className="mb-4">
                    {episode.video_url.endsWith('.json') ? (
                      <VideoManifestPlayer
                        manifestUrl={episode.video_url}
                        className="w-full rounded-lg aspect-video"
                      />
                    ) : episode.video_url.endsWith('.mp4') ? (
                      <video
                        src={episode.video_url}
                        controls
                        className="w-full rounded-lg"
                      />
                    ) : (
                      <img
                        src={episode.video_url}
                        alt="Episode preview"
                        className="w-full rounded-lg"
                      />
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleGenerate} disabled={isGenerating}>
                    <Play className="h-4 w-4 mr-2" />
                    {isGenerating ? 'Generating...' : 'Generate Video'}
                  </Button>
                  {episode.video_url && (
                    <Button variant="outline" asChild>
                      <a href={episode.video_url} download>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Synopsis</CardTitle>
              </CardHeader>
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

            <Card>
              <CardHeader>
                <CardTitle>Script</CardTitle>
              </CardHeader>
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
    </div>
  );
};

export default EpisodeDetail;
