import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Film, Youtube, CheckCircle, Loader2, PlayCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Episode {
  id: string;
  episode_number: number;
  title: string;
  synopsis: string;
  video_status: string;
  video_url?: string;
}

export const EpisodeProductionPanel = () => {
  const { toast } = useToast();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [producingEpisode, setProducingEpisode] = useState<string | null>(null);
  const [uploadingToYouTube, setUploadingToYouTube] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});

  const loadEpisodes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('episodes')
        .select('id, episode_number, title, synopsis, video_status, video_url')
        .eq('user_id', user.id)
        .order('episode_number', { ascending: true });

      if (error) throw error;

      setEpisodes(data || []);
    } catch (error) {
      console.error('Error loading episodes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load episodes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const produceEpisode = async (episodeId: string, uploadToYouTube: boolean = false) => {
    const episode = episodes.find(ep => ep.id === episodeId);
    if (!episode) return;

    // Prevent multiple episodes from processing simultaneously
    if (producingEpisode) {
      toast({
        title: '⚠️ Production In Progress',
        description: 'Please wait for the current episode to finish before starting another.',
        variant: 'destructive'
      });
      return;
    }

    setProducingEpisode(episodeId);
    setProgress({ ...progress, [episodeId]: 0 });

    toast({
      title: '🎬 VH1/Netflix Production Started',
      description: `Episode ${episode.episode_number}: ${episode.title} - Full Video Generation Active`,
    });

    try {
      // Start polling for progress
      const pollInterval = setInterval(async () => {
        const { data: updatedEpisode } = await supabase
          .from('episodes')
          .select('video_status')
          .eq('id', episodeId)
          .single();

        if (updatedEpisode?.video_status === 'processing') {
          setProgress(prev => ({
            ...prev,
            [episodeId]: Math.min((prev[episodeId] || 0) + 10, 90)
          }));
        } else if (updatedEpisode?.video_status === 'rendering') {
          setProgress(prev => ({
            ...prev,
            [episodeId]: 95
          }));
        }
      }, 3000);

      // Call production function
      const { data, error } = await supabase.functions.invoke('produce-and-upload-episode', {
        body: {
          episodeId: episodeId,
          uploadToYouTube: uploadToYouTube
        }
      });

      clearInterval(pollInterval);

      if (error) throw error;

      setProgress({ ...progress, [episodeId]: 100 });

      // Reload episodes to get updated data
      await loadEpisodes();

      toast({
        title: '🎉 VH1/Netflix Production Complete!',
        description: data.youtubeUrl 
          ? `Full MP4 video produced and uploaded to YouTube`
          : `Premium full video (MP4) generated - All FFmpeg bots active`,
      });

      if (data.youtubeUrl) {
        // Open YouTube video in new tab
        window.open(data.youtubeUrl, '_blank');
      }

    } catch (error) {
      console.error('Production error:', error);
      toast({
        title: 'Production Failed',
        description: error instanceof Error ? error.message : 'Failed to produce episode',
        variant: 'destructive'
      });
    } finally {
      setProducingEpisode(null);
      setProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[episodeId];
        return newProgress;
      });
    }
  };

  const uploadToYouTube = async (episodeId: string) => {
    const episode = episodes.find(ep => ep.id === episodeId);
    if (!episode || !episode.video_url) {
      toast({
        title: 'Cannot Upload',
        description: 'Episode must be produced first',
        variant: 'destructive'
      });
      return;
    }

    setUploadingToYouTube(episodeId);

    toast({
      title: '📺 Uploading to YouTube',
      description: `Uploading Episode ${episode.episode_number}...`,
    });

    try {
      const { data, error } = await supabase.functions.invoke('youtube-uploader', {
        body: {
          videoUrl: episode.video_url,
          title: episode.title,
          description: episode.synopsis || 'Generated by StoryForge Reality TV',
          episodeId: episodeId
        }
      });

      if (error) throw error;

      await loadEpisodes();

      toast({
        title: '✅ Uploaded to YouTube',
        description: `Video available at: ${data.youtubeUrl}`,
      });

      window.open(data.youtubeUrl, '_blank');

    } catch (error) {
      console.error('YouTube upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload to YouTube',
        variant: 'destructive'
      });
    } finally {
      setUploadingToYouTube(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'not_started': { label: 'Not Started', variant: 'outline' },
      'processing': { label: 'Processing', variant: 'secondary' },
      'rendering': { label: 'Rendering Video', variant: 'secondary' },
      'completed': { label: 'Completed', variant: 'default' },
      'failed': { label: 'Failed', variant: 'destructive' }
    };

    const config = statusConfig[status] || statusConfig['not_started'];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Load episodes on mount
  if (loading && episodes.length === 0) {
    loadEpisodes();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Film className="h-5 w-5" />
              Episode Production & YouTube Upload
            </CardTitle>
            <CardDescription>
              Produce high-quality videos with FFmpeg god-level bots and upload directly to YouTube
            </CardDescription>
          </div>
          <Button onClick={loadEpisodes} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : episodes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No episodes found. Create episodes first.
          </div>
        ) : (
          <div className="space-y-4">
            {episodes.map((episode) => {
              const isProducing = producingEpisode === episode.id;
              const isUploading = uploadingToYouTube === episode.id;
              const episodeProgress = progress[episode.id] || 0;

              return (
                <Card key={episode.id} className="border-muted">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-lg font-bold">
                              Ep {episode.episode_number}
                            </Badge>
                            <h3 className="font-semibold text-lg">{episode.title}</h3>
                          </div>
                          {episode.synopsis && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {episode.synopsis}
                            </p>
                          )}
                        </div>
                        <div className="ml-4">
                          {getStatusBadge(episode.video_status)}
                        </div>
                      </div>

                      {isProducing && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Production Progress</span>
                            <span>{episodeProgress}%</span>
                          </div>
                          <Progress value={episodeProgress} />
                        </div>
                      )}

                      <div className="flex gap-2">
                        {episode.video_status === 'not_started' || episode.video_status === 'failed' ? (
                          <>
                            <Button
                              onClick={() => produceEpisode(episode.id, false)}
                              disabled={isProducing || !!producingEpisode}
                              className="flex-1"
                            >
                              {isProducing ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Full Video Producing...
                                </>
                              ) : (
                                <>
                                  <PlayCircle className="mr-2 h-4 w-4" />
                                  Produce Full MP4 Video
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => produceEpisode(episode.id, true)}
                              disabled={isProducing || !!producingEpisode}
                              variant="default"
                              className="flex-1"
                            >
                              {isProducing ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Producing & Uploading...
                                </>
                              ) : (
                                <>
                                  <Youtube className="mr-2 h-4 w-4" />
                                  Produce & Upload to YouTube
                                </>
                              )}
                            </Button>
                          </>
                        ) : episode.video_status === 'completed' ? (
                          <>
                            {episode.video_url && (
                              <Button
                                onClick={() => window.open(episode.video_url, '_blank')}
                                variant="outline"
                                className="flex-1"
                              >
                                <PlayCircle className="mr-2 h-4 w-4" />
                                View Video
                              </Button>
                            )}
                            <Button
                              onClick={() => uploadToYouTube(episode.id)}
                              disabled={isUploading}
                              variant="default"
                              className="flex-1"
                            >
                              {isUploading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Youtube className="mr-2 h-4 w-4" />
                                  Upload to YouTube
                                </>
                              )}
                            </Button>
                          </>
                        ) : (
                          <Button disabled className="flex-1">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {episode.video_status === 'processing' ? 'Processing...' : 'Rendering...'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
          <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
            <span className="text-xl">🎬</span>
            VH1/NETFLIX PREMIUM PRODUCTION PIPELINE
          </h4>
          
          <div className="space-y-3">
            <div className="bg-black/20 p-3 rounded">
              <h5 className="font-semibold text-xs mb-2 text-purple-400">👭 Cast: Say Walahi Sisters</h5>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="text-xs">• <span className="font-medium">Lucky</span> - Visionary Architect</div>
                <div className="text-xs">• <span className="font-medium">Luul</span> - Cultural Anchor</div>
                <div className="text-xs">• <span className="font-medium">Samara</span> - The Strategist</div>
                <div className="text-xs">• <span className="font-medium">Ayaan</span> - Systems Queen</div>
                <div className="text-xs">• <span className="font-medium">Hani</span> - The Oracle</div>
                <div className="text-xs">• <span className="font-medium">Zahra</span> - Satirical Provocateur</div>
                <div className="text-xs">• <span className="font-medium">Nasra</span> - Emotional Core</div>
                <div className="text-xs">• <span className="font-medium">Amal</span> - Chaos Console</div>
              </div>
            </div>

            <div className="bg-black/20 p-3 rounded">
              <h5 className="font-semibold text-xs mb-2 text-pink-400">🎵 Music: Suno AI by DJ LuckLuck</h5>
              <p className="text-xs text-muted-foreground">Custom VH1 Reality TV / Urban Hip-Hop theme generated for each episode</p>
            </div>

            <div className="bg-black/20 p-3 rounded">
              <h5 className="font-semibold text-xs mb-2 text-blue-400">🎬 Director Oversight: ACTIVE</h5>
              <p className="text-xs text-muted-foreground">Expert director oversees VH1/Netflix premium quality standards</p>
            </div>

            <div className="bg-black/20 p-3 rounded">
              <h5 className="font-semibold text-xs mb-2 text-green-400">⚡ FFmpeg God-Level Bots: ALL ACTIVE</h5>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>✅ Scene Composer Bot - Orchestrates scene flow & transitions</p>
                <p>✅ Frame Optimizer Bot - 1080p HD optimization</p>
                <p>✅ Color Grader Bot - VH1/BET premium color grading</p>
                <p>✅ Video Quality Enhancer Bot - Broadcast-grade quality</p>
                <p>✅ Effects Bot - Motion graphics & animations</p>
                <p>✅ Audio Sync Bot - Perfect audio-video synchronization</p>
                <p>✅ Audio Master Bot - Professional audio mastering</p>
              </div>
            </div>

            <div className="bg-black/20 p-3 rounded">
              <h5 className="font-semibold text-xs mb-2 text-orange-400">📺 Output: FULL MP4 VIDEO</h5>
              <p className="text-xs text-muted-foreground">Complete video file (NOT manifest) - Ready for YouTube, Netflix, VH1</p>
            </div>

            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-3 rounded border border-yellow-500/30">
              <h5 className="font-bold text-xs mb-2">⚡ PRODUCTION WORKFLOW</h5>
              <div className="space-y-1 text-xs">
                <p>1️⃣ God Mode Production (Script + Scenes + Voiceovers + Images)</p>
                <p>2️⃣ Suno Music Generation (DJ LuckLuck Theme)</p>
                <p>3️⃣ Director Workflow Oversight</p>
                <p>4️⃣ FFmpeg Full Video Compilation (All 7 Bots)</p>
                <p>5️⃣ High-Quality MP4 Generation (VH1/Netflix Grade)</p>
                <p>6️⃣ YouTube Upload (Optional)</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
