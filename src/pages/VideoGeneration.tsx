import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { VideoEditor } from '@/components/VideoEditor';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Film, Sparkles, Zap, Download, Share2, Settings,
  Wand2, Brain, Cpu, Layers, Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Scene {
  id: string;
  duration: number;
  background: string;
  elements: any[];
  voiceover?: string;
  music?: string;
  transition?: string;
}

const VideoGeneration = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const episodeId = searchParams.get('episodeId');
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [episode, setEpisode] = useState<any>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [generatingScenes, setGeneratingScenes] = useState(false);
  const [renderingVideo, setRenderingVideo] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      
      if (episodeId) {
        fetchEpisode();
      } else {
        setLoading(false);
      }
    };
    checkAuth();
  }, [episodeId, navigate]);

  const fetchEpisode = async () => {
    if (!episodeId) return;

    try {
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('id', episodeId)
        .single();

      if (error) throw error;

      setEpisode(data);

      // Initialize scenes from storyboard if available
      if (data.storyboard && Array.isArray(data.storyboard)) {
        const initialScenes = data.storyboard.map((frame: any, idx: number) => ({
          id: `scene-${idx}`,
          duration: 5,
          background: '#000000',
          elements: [
            {
              type: 'text',
              content: frame.description || frame.scene || 'Scene',
              x: 100,
              y: 100,
              fontSize: 64,
              color: '#ffffff',
              fontFamily: 'Arial',
              fontWeight: 'bold',
            }
          ],
        }));
        setScenes(initialScenes);
      } else {
        // Create default scenes
        setScenes([
          {
            id: 'scene-1',
            duration: 5,
            background: '#000000',
            elements: [
              {
                type: 'text',
                content: data.title || 'Episode',
                x: 100,
                y: 100,
                fontSize: 72,
                color: '#ffffff',
                fontFamily: 'Arial',
                fontWeight: 'bold',
              }
            ],
          }
        ]);
      }

    } catch (error) {
      toast({
        title: "Error loading episode",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAIScenes = async () => {
    if (!episode) return;

    setGeneratingScenes(true);

    try {
      // Call the ultra-video-bot to generate scenes
      const { data, error } = await supabase.functions.invoke('ultra-video-bot', {
        body: {
          episodeId: episode.id,
          enhancementLevel: 'ultra'
        }
      });

      if (error) throw error;

      toast({
        title: "🎬 AI Scenes Generated!",
        description: "Ultra-realistic scenes created with GODLIKE quality",
      });

      // Fetch updated episode data
      await fetchEpisode();

    } catch (error) {
      toast({
        title: "Scene Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setGeneratingScenes(false);
    }
  };

  const renderFinalVideo = async () => {
    if (!episodeId) return;

    setRenderingVideo(true);

    try {
      const { data, error } = await supabase.functions.invoke('render-episode-video', {
        body: {
          episodeId,
          scenes,
          resolution: { width: 1920, height: 1080 },
          fps: 30
        }
      });

      if (error) throw error;

      toast({
        title: "🎥 Video Rendering Started!",
        description: "Your video is being rendered. This may take a few minutes.",
      });

    } catch (error) {
      toast({
        title: "Rendering Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setRenderingVideo(false);
    }
  };

  const exportVideo = async (resolution: '4K' | 'FHD' | 'HD') => {
    if (!episode?.video_url) {
      toast({
        title: "No Video Available",
        description: "Please render the video first before exporting.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "🎬 Preparing Download",
        description: "Fetching your video...",
      });

      // Download the video from the storage URL
      const response = await fetch(episode.video_url);
      if (!response.ok) throw new Error('Failed to fetch video');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${episode.title.replace(/[^a-z0-9]/gi, '_')}_${resolution}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "✅ Download Started!",
        description: `Downloading ${episode.title} in ${resolution}`,
      });

    } catch (error) {
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-primary-glow bg-clip-text text-transparent">
                GODLIKE Video Generator
              </h1>
              <p className="text-muted-foreground text-lg">
                Ultra-realistic AI-powered video production
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={generateAIScenes}
                disabled={generatingScenes || !episode}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
              >
                {generatingScenes ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    AI Scene Generation
                  </>
                )}
              </Button>

              <Button
                onClick={renderFinalVideo}
                disabled={renderingVideo || scenes.length === 0}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {renderingVideo ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Rendering...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Render Video
                  </>
                )}
              </Button>
            </div>
          </div>

          {episode && (
            <Card className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{episode.title}</h2>
                  <p className="text-muted-foreground">{episode.synopsis}</p>
                </div>
                <Badge className="bg-gradient-to-r from-primary to-accent">
                  Episode {episode.episode_number}
                </Badge>
              </div>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="editor" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="editor" className="gap-2">
              <Film className="h-4 w-4" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="effects" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Effects
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Wand2 className="h-4 w-4" />
              AI Tools
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-6">
            {episodeId && scenes.length > 0 && (
              <VideoEditor
                episodeId={episodeId}
                scenes={scenes}
                onScenesUpdate={setScenes}
              />
            )}
          </TabsContent>

          <TabsContent value="effects" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Visual Effects & Transitions
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Fade', 'Slide', 'Zoom', 'Blur', 'Glitch', 'Particles', 'Glow', 'Chromatic'].map((effect) => (
                  <Button
                    key={effect}
                    variant="outline"
                    className="h-20 border-primary/30 hover:bg-primary/10"
                  >
                    <div className="text-center">
                      <Layers className="h-5 w-5 mx-auto mb-1" />
                      <p className="text-sm">{effect}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  AI Enhancement
                </h3>
                <div className="space-y-3">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
                    <Cpu className="h-4 w-4 mr-2" />
                    Ultra-Realism Mode
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Auto Color Grading
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Zap className="h-4 w-4 mr-2" />
                    Motion Smoothing
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-accent" />
                  Smart Automation
                </h3>
                <div className="space-y-3">
                  <Button className="w-full bg-gradient-to-r from-primary to-accent">
                    <Film className="h-4 w-4 mr-2" />
                    Auto-Generate Scenes
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Share2 className="h-4 w-4 mr-2" />
                    Viral Optimization
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Platform Formatting
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            {/* Video Preview */}
            {episode?.video_url && (
              <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Film className="h-6 w-6 text-primary" />
                  Video Preview
                </h3>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video 
                    src={episode.video_url} 
                    controls 
                    className="w-full h-full"
                    controlsList="nodownload"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Badge className="bg-success">
                    ✅ Video Ready
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Status: {episode.video_status || 'completed'}
                  </p>
                </div>
              </Card>
            )}

            {/* Export Options */}
            <Card className="p-6">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Download className="h-6 w-6 text-primary" />
                Export & Download
              </h3>

              {!episode?.video_url ? (
                <div className="text-center py-8">
                  <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No video available yet. Please render the video first.
                  </p>
                  <Button 
                    onClick={renderFinalVideo} 
                    className="mt-4 bg-gradient-to-r from-primary to-accent"
                    disabled={renderingVideo}
                  >
                    {renderingVideo ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Rendering...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Render Video Now
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {[
                      { format: '4K (3840x2160)', quality: 'Ultra', size: '~2GB', res: '4K' as const },
                      { format: 'Full HD (1920x1080)', quality: 'High', size: '~500MB', res: 'FHD' as const },
                      { format: 'HD (1280x720)', quality: 'Standard', size: '~200MB', res: 'HD' as const },
                    ].map((preset) => (
                      <Card 
                        key={preset.format} 
                        className="p-4 border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                        onClick={() => exportVideo(preset.res)}
                      >
                        <h4 className="font-bold mb-2 group-hover:text-primary transition-colors">
                          {preset.format}
                        </h4>
                        <p className="text-sm text-muted-foreground">Quality: {preset.quality}</p>
                        <p className="text-xs text-muted-foreground">{preset.size}</p>
                        <Button 
                          className="w-full mt-3" 
                          size="sm"
                          variant="outline"
                        >
                          <Download className="h-3 w-3 mr-2" />
                          Download
                        </Button>
                      </Card>
                    ))}
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-accent h-14 text-lg hover:opacity-90"
                    onClick={() => exportVideo('FHD')}
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Quick Download (Full HD)
                  </Button>
                </>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default VideoGeneration;
