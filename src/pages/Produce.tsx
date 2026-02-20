import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import {
  Clapperboard, Sparkles, Users, MapPin, Film,
  Loader2, ArrowRight, ChevronDown, ChevronUp,
  Video, CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductionResult {
  show: any;
  project: any;
  characters: any[];
  episodes: any[];
  locations: any[];
  seasonArc: string;
}

type EpisodeRenderStatus = 'idle' | 'queued' | 'rendering' | 'done' | 'failed';

interface EpisodeVideoStatus {
  [episodeId: string]: EpisodeRenderStatus;
}

const Produce = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [episodeCount, setEpisodeCount] = useState(6);
  const [generating, setGenerating] = useState(false);
  const [phase, setPhase] = useState('');
  const [result, setResult] = useState<ProductionResult | null>(null);
  const [expandedEpisode, setExpandedEpisode] = useState<number | null>(null);
  const [videoStatuses, setVideoStatuses] = useState<EpisodeVideoStatus>({});
  const [generatingVideos, setGeneratingVideos] = useState(false);

  const phases = [
    'Analyzing concept...',
    'Casting characters...',
    'Scouting locations...',
    'Writing season arc...',
    'Building episode scripts...',
    'Composing scene storyboards...',
    'Finalizing production bible...',
  ];

  const handleGenerate = async () => {
    if (!prompt.trim() || prompt.trim().length < 10) {
      toast({ title: 'Write more', description: 'Your concept needs at least 10 characters.', variant: 'destructive' });
      return;
    }

    setGenerating(true);
    setResult(null);

    // Simulate phase progression
    let phaseIdx = 0;
    const interval = setInterval(() => {
      if (phaseIdx < phases.length) {
        setPhase(phases[phaseIdx]);
        phaseIdx++;
      }
    }, 2000);

    try {
      const { data, error } = await supabase.functions.invoke('prompt-to-production', {
        body: { prompt, episodesPerSeason: episodeCount },
      });

      clearInterval(interval);

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data.production);
      setPhase('');
      toast({ title: '🎬 Production Complete!', description: data.message });
    } catch (error) {
      clearInterval(interval);
      setPhase('');
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateAllVideos = async () => {
    if (!result?.episodes?.length) return;
    setGeneratingVideos(true);

    // Mark all episodes as queued immediately
    const initialStatuses: EpisodeVideoStatus = {};
    result.episodes.forEach(ep => { initialStatuses[ep.id] = 'queued'; });
    setVideoStatuses(initialStatuses);

    toast({ title: '🎬 Batch rendering started', description: `Firing up ${result.episodes.length} episodes simultaneously...` });

    // Fire all render requests in parallel
    const renderPromises = result.episodes.map(async (ep) => {
      setVideoStatuses(prev => ({ ...prev, [ep.id]: 'rendering' }));
      try {
        const { error } = await supabase.functions.invoke('generate-video', {
          body: { episodeId: ep.id },
        });
        if (error) throw error;
        setVideoStatuses(prev => ({ ...prev, [ep.id]: 'done' }));
        return { id: ep.id, success: true };
      } catch (err) {
        setVideoStatuses(prev => ({ ...prev, [ep.id]: 'failed' }));
        return { id: ep.id, success: false };
      }
    });

    const results = await Promise.allSettled(renderPromises);
    const succeeded = results.filter(r => r.status === 'fulfilled' && (r.value as any)?.success).length;

    setGeneratingVideos(false);
    toast({
      title: succeeded === result.episodes.length ? '✅ All videos queued!' : `⚡ ${succeeded}/${result.episodes.length} episodes queued`,
      description: 'Episodes are rendering in the background. Check each episode for status.',
    });
  };

  const renderStatusIcon = (status: EpisodeRenderStatus) => {
    if (status === 'queued') return <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />;
    if (status === 'rendering') return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
    if (status === 'done') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === 'failed') return <XCircle className="h-4 w-4 text-destructive" />;
    return null;
  };

  const videoStatusCount = Object.values(videoStatuses);
  const doneCount = videoStatusCount.filter(s => s === 'done').length;
  const renderProgress = result?.episodes?.length
    ? Math.round((doneCount / result.episodes.length) * 100)
    : 0;

  const roleColors: Record<string, string> = {
    protagonist: 'bg-primary',
    antagonist: 'bg-destructive',
    wildcard: 'bg-yellow-500',
    peacemaker: 'bg-green-500',
    narrator: 'bg-accent',
    'comic-relief': 'bg-pink-500',
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 pt-24 pb-16 max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Clapperboard className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">2075-Grade Production Engine</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-primary via-accent to-primary-glow bg-clip-text text-transparent leading-tight">
            Paragraph → Production
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Write a paragraph. Get a cast, a set, a scene — and a season — with voices, faces, emotions, and locations indistinguishable from live action.
          </p>
        </div>

        {/* Prompt Input */}
        {!result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-primary/20 bg-card/80 backdrop-blur">
              <CardContent className="p-8 space-y-6">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Eight Somali-British sisters reunite in a luxury London flat after years apart. Old rivalries reignite when the eldest announces she's running for parliament — and the youngest starts a competing podcast exposing family secrets..."
                  className="min-h-[160px] text-lg bg-background/50 border-border/50 focus:border-primary resize-none"
                  disabled={generating}
                />

                <div className="flex items-center justify-between gap-8">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm text-muted-foreground">
                      Episodes per season: <span className="font-bold text-foreground">{episodeCount}</span>
                    </label>
                    <Slider
                      value={[episodeCount]}
                      onValueChange={([v]) => setEpisodeCount(v)}
                      min={3}
                      max={12}
                      step={1}
                      disabled={generating}
                    />
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={generating || prompt.trim().length < 10}
                    size="lg"
                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90 px-8 text-lg h-14"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Producing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Produce
                      </>
                    )}
                  </Button>
                </div>

                {/* Phase indicator */}
                <AnimatePresence>
                  {generating && phase && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-4 border-t border-border/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <p className="text-muted-foreground font-medium">{phase}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Show Info */}
              <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-3xl font-extrabold">{result.show?.title}</h2>
                      <p className="text-lg text-muted-foreground mt-1">{result.show?.logline}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-primary">{result.show?.genre}</Badge>
                      <Badge variant="outline">{result.show?.mood}</Badge>
                    </div>
                  </div>
                  {result.seasonArc && (
                    <p className="text-muted-foreground italic border-l-2 border-primary/40 pl-4">
                      Season Arc: {result.seasonArc}
                    </p>
                  )}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button onClick={() => navigate(`/episodes?projectId=${result.project?.id}`)}>
                      <Film className="h-4 w-4 mr-2" />
                      Open Episodes
                    </Button>
                    <Button
                      onClick={handleGenerateAllVideos}
                      disabled={generatingVideos}
                      className="bg-gradient-to-r from-accent to-primary hover:opacity-90"
                    >
                      {generatingVideos ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Queuing Videos...</>
                      ) : (
                        <><Video className="h-4 w-4 mr-2" />Generate All Videos</>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => { setResult(null); setPrompt(''); setVideoStatuses({}); }}>
                      New Production
                    </Button>
                  </div>

                  {/* Batch render progress */}
                  <AnimatePresence>
                    {Object.keys(videoStatuses).length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-border/30"
                      >
                        <div className="flex items-center justify-between mb-2 text-sm">
                          <span className="text-muted-foreground font-medium">Batch render progress</span>
                          <span className="font-bold">{doneCount}/{result.episodes.length} episodes queued</span>
                        </div>
                        <Progress value={renderProgress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                          Episodes are rendering in the background — check the Episodes page for live status.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Cast */}
              <div>
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary" />
                  Cast ({result.characters.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {result.characters.map((char, i) => (
                    <Card key={char.id || i} className="border-border/50 hover:border-primary/30 transition-colors">
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-lg">{char.name}</h4>
                          <Badge className={roleColors[char.role] || 'bg-muted'} variant="secondary">
                            {char.role}
                          </Badge>
                        </div>
                        {char.age && <p className="text-sm text-muted-foreground">Age {char.age}</p>}
                        <p className="text-sm">{char.personality}</p>
                        <p className="text-xs text-muted-foreground">{char.background}</p>
                        {char.metadata?.voice_style && (
                          <p className="text-xs italic text-primary/70">🎙 {char.metadata.voice_style}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Locations */}
              {result.locations.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <MapPin className="h-6 w-6 text-accent" />
                    Locations ({result.locations.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {result.locations.map((loc: any, i: number) => (
                      <Card key={i} className="border-border/50">
                        <CardContent className="p-5">
                          <h4 className="font-bold">{loc.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{loc.description}</p>
                          <Badge variant="outline" className="mt-2 text-xs">{loc.mood}</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Episodes */}
              <div>
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Film className="h-6 w-6 text-primary-glow" />
                  Season 1 — {result.episodes.length} Episodes
                </h3>
                <div className="space-y-3">
                  {result.episodes.map((ep, i) => {
                    const storyboard = Array.isArray(ep.storyboard) ? ep.storyboard : [];
                    const isExpanded = expandedEpisode === i;

                    return (
                      <Card key={ep.id || i} className="border-border/50 overflow-hidden">
                        <button
                          className="w-full p-5 flex items-center justify-between text-left hover:bg-card/80 transition-colors"
                          onClick={() => setExpandedEpisode(isExpanded ? null : i)}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-2xl font-black text-primary/40">
                              {String(ep.episode_number).padStart(2, '0')}
                            </span>
                            <div>
                              <h4 className="font-bold text-lg">{ep.title}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-1">{ep.synopsis}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{storyboard.length} scenes</Badge>
                            {videoStatuses[ep.id] && (
                              <span className="flex items-center gap-1 text-xs">
                                {renderStatusIcon(videoStatuses[ep.id])}
                                <span className="text-muted-foreground capitalize">{videoStatuses[ep.id]}</span>
                              </span>
                            )}
                            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          </div>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-5 pb-5 space-y-3 border-t border-border/30 pt-4">
                                {storyboard.map((scene: any, si: number) => (
                                  <div key={si} className="flex gap-4 p-3 rounded-lg bg-background/50">
                                    <span className="text-sm font-mono text-muted-foreground w-8 shrink-0">
                                      S{scene.scene_number || si + 1}
                                    </span>
                                    <div className="flex-1 space-y-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant="outline" className="text-xs">{scene.location}</Badge>
                                        <Badge className="bg-primary/20 text-primary text-xs">{scene.emotion}</Badge>
                                        {scene.duration_seconds && (
                                          <span className="text-xs text-muted-foreground">{scene.duration_seconds}s</span>
                                        )}
                                      </div>
                                      <p className="text-sm">{scene.description}</p>
                                      {scene.characters?.length > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                          👥 {scene.characters.join(', ')}
                                        </p>
                                      )}
                                      {scene.music_cue && (
                                        <p className="text-xs text-accent/70">🎵 {scene.music_cue}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                <div className="flex justify-end pt-2">
                                  <Button
                                    size="sm"
                                    onClick={() => navigate(`/episodes/${ep.id}`)}
                                  >
                                    Open Episode <ArrowRight className="h-3 w-3 ml-1" />
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Produce;
