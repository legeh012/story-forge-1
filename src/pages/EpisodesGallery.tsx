import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from "@/components/Navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Film, Clock, Sparkles } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { VideoManifestPlayer } from '@/components/VideoManifestPlayer';
import { BatchVideoRenderer } from '@/components/BatchVideoRenderer';
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [season1Episodes, setSeason1Episodes] = useState<Episode[]>([]);
  const [season2Episodes, setSeason2Episodes] = useState<Episode[]>([]);
  const [season1Trailer, setSeason1Trailer] = useState<string | null>(null);
  const [season2Trailer, setSeason2Trailer] = useState<string | null>(null);
  const [generatingTrailer, setGeneratingTrailer] = useState<number | null>(null);

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

      // Check for existing trailers
      await checkForTrailers();
    } catch (error) {
      console.error('Error fetching episodes:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForTrailers = async () => {
    try {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      // Check for season 1 trailer
      const { data: s1Files } = await supabase.storage
        .from('episode-videos')
        .list('trailers/season-1');
      
      if (s1Files?.some(f => f.name === 'trailer-manifest.json')) {
        const url = `${baseUrl}/storage/v1/object/public/episode-videos/trailers/season-1/trailer-manifest.json`;
        setSeason1Trailer(url);
      }

      // Check for season 2 trailer
      const { data: s2Files } = await supabase.storage
        .from('episode-videos')
        .list('trailers/season-2');
      
      if (s2Files?.some(f => f.name === 'trailer-manifest.json')) {
        const url = `${baseUrl}/storage/v1/object/public/episode-videos/trailers/season-2/trailer-manifest.json`;
        setSeason2Trailer(url);
      }
    } catch (error) {
      console.error('Error checking trailers:', error);
    }
  };

  const generateTrailer = async (season: number) => {
    setGeneratingTrailer(season);
    try {
      // Verify authentication
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        throw new Error('Authentication required. Please log in again.');
      }

      toast({
        title: `Generating Season ${season} Trailer`,
        description: 'Creating dramatic photorealistic scenes...',
      });

      const { data, error } = await supabase.functions.invoke('generate-season-trailer', {
        body: { 
          season,
          projectId: 'e4d77d29-e1ef-4ad7-a041-cc9421ad76a7' // The Real Sisters in the Diaspora
        }
      });

      if (error) {
        console.error('Trailer generation function error:', error);
        
        // Check if it's a network error
        if (error.message?.includes('Failed to send') || error.message?.includes('Load failed')) {
          throw new Error('Network error: Unable to reach trailer generation service. Edge functions may be deploying. Please try again in a moment.');
        }
        
        throw error;
      }

      if (data?.trailerUrl) {
        if (season === 1) setSeason1Trailer(data.trailerUrl);
        if (season === 2) setSeason2Trailer(data.trailerUrl);
        
        toast({
          title: '🎬 Trailer Complete!',
          description: `Season ${season} trailer generated successfully`,
        });
      }
    } catch (error) {
      console.error('Trailer generation error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate trailer';
      
      toast({
        title: 'Generation Failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 10000
      });
    } finally {
      setGeneratingTrailer(null);
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

          {/* Batch Video Renderer */}
          <div className="mb-8">
            <BatchVideoRenderer />
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
              {/* Season 1 Trailer */}
              <Card className="border-primary/50 bg-gradient-to-br from-primary/10 to-accent/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Film className="h-5 w-5" />
                        Season 1 Trailer
                      </CardTitle>
                      <CardDescription>Official season preview</CardDescription>
                    </div>
                    {!season1Trailer && (
                      <Button 
                        onClick={() => generateTrailer(1)}
                        disabled={generatingTrailer === 1}
                        className="bg-gradient-to-r from-primary to-accent"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {generatingTrailer === 1 ? 'Generating...' : 'Generate Trailer'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {season1Trailer ? (
                    <VideoManifestPlayer manifestUrl={season1Trailer} />
                  ) : (
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">No trailer generated yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Episodes */}
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
              {/* Season 2 Trailer */}
              <Card className="border-accent/50 bg-gradient-to-br from-accent/10 to-primary-glow/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Film className="h-5 w-5" />
                        Season 2 Trailer
                      </CardTitle>
                      <CardDescription>Official season preview</CardDescription>
                    </div>
                    {!season2Trailer && (
                      <Button 
                        onClick={() => generateTrailer(2)}
                        disabled={generatingTrailer === 2}
                        className="bg-gradient-to-r from-accent to-primary-glow"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {generatingTrailer === 2 ? 'Generating...' : 'Generate Trailer'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {season2Trailer ? (
                    <VideoManifestPlayer manifestUrl={season2Trailer} />
                  ) : (
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">No trailer generated yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Episodes */}
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
