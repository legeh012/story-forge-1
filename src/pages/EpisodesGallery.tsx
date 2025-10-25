import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from "@/components/Navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Film, Clock } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { VideoManifestPlayer } from '@/components/VideoManifestPlayer';
import SEOHead from '@/components/SEOHead';

interface Episode {
  id: string;
  episode_number: number;
  season: number;
  title: string;
  synopsis: string;
  video_status: string;
  video_url: string | null;
  created_at: string;
}

const EpisodesGallery = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [season1Episodes, setSeason1Episodes] = useState<Episode[]>([]);
  const [season2Episodes, setSeason2Episodes] = useState<Episode[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      fetchEpisodes(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  const fetchEpisodes = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('user_id', userId)
        .in('season', [1, 2])
        .order('season', { ascending: true })
        .order('episode_number', { ascending: true });

      if (error) throw error;

      const season1 = data?.filter(ep => ep.season === 1) || [];
      const season2 = data?.filter(ep => ep.season === 2) || [];

      setSeason1Episodes(season1);
      setSeason2Episodes(season2);
    } catch (error) {
      console.error('Error fetching episodes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success">Completed</Badge>;
      case 'rendering':
        return <Badge className="bg-primary animate-pulse">Rendering</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  const EpisodeCard = ({ episode }: { episode: Episode }) => (
    <Card className="overflow-hidden border-border hover:border-primary/50 transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">
              Episode {episode.episode_number}: {episode.title}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {episode.synopsis || 'No synopsis available'}
            </CardDescription>
          </div>
          <div className="ml-3">
            {getStatusBadge(episode.video_status)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {episode.video_status === 'completed' && episode.video_url ? (
          <div className="space-y-3">
            <VideoManifestPlayer 
              manifestUrl={episode.video_url}
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Film className="h-4 w-4" />
              <span>Netflix-Grade Photorealistic</span>
            </div>
          </div>
        ) : episode.video_status === 'rendering' ? (
          <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-sm text-muted-foreground">Rendering photorealistic scenes...</p>
            </div>
          </div>
        ) : episode.video_status === 'failed' ? (
          <div className="aspect-video bg-destructive/10 rounded-lg flex items-center justify-center border border-destructive/30">
            <p className="text-sm text-destructive">Video generation failed</p>
          </div>
        ) : (
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Video not generated yet</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title="Episodes Gallery - Season 1 & 2"
        description="Watch all episodes from Season 1 and Season 2 with Netflix-grade photorealistic quality"
      />
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <main className="container mx-auto px-4 pt-24 pb-16">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-primary-glow bg-clip-text text-transparent">
              Episodes Gallery
            </h1>
            <p className="text-muted-foreground text-lg flex items-center gap-2">
              <Film className="h-5 w-5" />
              Khat and Karma - Premium Reality TV Series
            </p>
          </div>

          <Tabs defaultValue="season1" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
              <TabsTrigger value="season1" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Season 1 ({season1Episodes.length})
              </TabsTrigger>
              <TabsTrigger value="season2" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Season 2 ({season2Episodes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="season1" className="space-y-6">
              {season1Episodes.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">No episodes in Season 1 yet</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {season1Episodes.map((episode) => (
                    <EpisodeCard key={episode.id} episode={episode} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="season2" className="space-y-6">
              {season2Episodes.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">No episodes in Season 2 yet</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {season2Episodes.map((episode) => (
                    <EpisodeCard key={episode.id} episode={episode} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
};

export default EpisodesGallery;
