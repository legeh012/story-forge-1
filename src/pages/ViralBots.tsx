import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import SEOHead from "@/components/SEOHead";
import { BotCard } from "@/components/BotCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { TrendingUp, Lightbulb, Wand2, Sparkles, Activity } from "lucide-react";

interface Bot {
  id: string;
  name: string;
  bot_type: string;
  is_active: boolean;
  updated_at: string;
}

const ViralBots = () => {
  const { toast } = useToast();
  const [bots, setBots] = useState<Bot[]>([]);
  const [runningBots, setRunningBots] = useState<Set<string>>(new Set());
  const [trends, setTrends] = useState<any[]>([]);
  const [hookOptimizations, setHookOptimizations] = useState<any[]>([]);
  const [remixes, setRemixes] = useState<any[]>([]);
  const [injections, setInjections] = useState<any[]>([]);

  useEffect(() => {
    fetchBots();
    fetchResults();
  }, []);

  const fetchBots = async () => {
    const { data, error } = await supabase
      .from('viral_bots')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load bots",
        variant: "destructive",
      });
      return;
    }

    if (data && data.length === 0) {
      await initializeBots();
    } else {
      setBots(data || []);
    }
  };

  const initializeBots = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const defaultBots = [
      {
        user_id: user.id,
        bot_type: 'trend_detection' as const,
        name: 'Trend Detection Bot',
        is_active: true,
      },
      {
        user_id: user.id,
        bot_type: 'hook_optimization' as const,
        name: 'Hook Optimization Bot',
        is_active: true,
      },
      {
        user_id: user.id,
        bot_type: 'remix' as const,
        name: 'Remix Bot',
        is_active: true,
      },
      {
        user_id: user.id,
        bot_type: 'cultural_injection' as const,
        name: 'Cultural Injection Bot',
        is_active: true,
      },
    ];

    const { error } = await supabase.from('viral_bots').insert(defaultBots);
    
    if (!error) {
      fetchBots();
    }
  };

  const fetchResults = async () => {
    const [trendsData, hooksData, remixesData, injectionsData] = await Promise.all([
      supabase.from('trend_detections').select('*').order('detected_at', { ascending: false }).limit(10),
      supabase.from('hook_optimizations').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('content_remixes').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('cultural_injections').select('*').order('created_at', { ascending: false }).limit(10),
    ]);

    setTrends(trendsData.data || []);
    setHookOptimizations(hooksData.data || []);
    setRemixes(remixesData.data || []);
    setInjections(injectionsData.data || []);
  };

  const toggleBot = async (botId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('viral_bots')
      .update({ is_active: !currentStatus })
      .eq('id', botId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update bot status",
        variant: "destructive",
      });
      return;
    }

    fetchBots();
    toast({
      title: "Success",
      description: `Bot ${!currentStatus ? 'activated' : 'deactivated'}`,
    });
  };

  const runBot = async (bot: Bot) => {
    setRunningBots(prev => new Set(prev).add(bot.id));

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Error",
        description: "You must be logged in to run bots",
        variant: "destructive",
      });
      setRunningBots(prev => {
        const newSet = new Set(prev);
        newSet.delete(bot.id);
        return newSet;
      });
      return;
    }

    const functionMap = {
      trend_detection: 'trend-detection-bot',
      hook_optimization: 'hook-optimization-bot',
      remix: 'remix-bot',
      cultural_injection: 'cultural-injection-bot',
    };

    const functionName = functionMap[bot.bot_type as keyof typeof functionMap];

    const payload: any = { bot_id: bot.id };
    if (bot.bot_type === 'hook_optimization') {
      payload.content_title = 'My Awesome Video';
      payload.content_description = 'This is an amazing video you should watch!';
    } else if (bot.bot_type === 'remix') {
      payload.source_content = 'Create engaging viral content';
    } else if (bot.bot_type === 'cultural_injection') {
      payload.original_content = 'Check out this amazing content!';
    }

    const { error } = await supabase.functions.invoke(functionName, {
      body: payload,
    });

    setRunningBots(prev => {
      const newSet = new Set(prev);
      newSet.delete(bot.id);
      return newSet;
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to run bot",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `${bot.name} started successfully`,
    });

    setTimeout(() => fetchResults(), 2000);
  };

  const getBotIcon = (type: string) => {
    switch (type) {
      case 'trend_detection': return <TrendingUp className="h-4 w-4" />;
      case 'hook_optimization': return <Lightbulb className="h-4 w-4" />;
      case 'remix': return <Wand2 className="h-4 w-4" />;
      case 'cultural_injection': return <Sparkles className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getBotDescription = (type: string) => {
    switch (type) {
      case 'trend_detection':
        return 'Scrapes TikTok, YouTube, Reddit for rising formats, hashtags, and audio trends';
      case 'hook_optimization':
        return 'Refines titles, thumbnails, and intros for maximum click-through rates';
      case 'remix':
        return 'Auto-generates memes, duets, reactions, and cinematic remixes';
      case 'cultural_injection':
        return 'Adds humor, controversy, or culturally relevant twists to boost engagement';
      default:
        return 'Viral content optimization bot';
    }
  };

  return (
    <>
      <SEOHead
        title="Viral Bots - AI Content Optimization"
        description="Automate your content virality with AI-powered bots for trend detection, hook optimization, remixing, and cultural injection"
      />
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Viral Bots Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">
                AI-powered automation for viral content creation
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {bots.map((bot) => (
                <BotCard
                  key={bot.id}
                  name={bot.name}
                  type={bot.bot_type.replace('_', ' ')}
                  description={getBotDescription(bot.bot_type)}
                  isActive={bot.is_active}
                  lastRun={bot.updated_at}
                  onToggle={() => toggleBot(bot.id, bot.is_active)}
                  onRun={() => runBot(bot)}
                  isRunning={runningBots.has(bot.id)}
                />
              ))}
            </div>

            <Tabs defaultValue="trends" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="trends">Trends ({trends.length})</TabsTrigger>
                <TabsTrigger value="hooks">Hooks ({hookOptimizations.length})</TabsTrigger>
                <TabsTrigger value="remixes">Remixes ({remixes.length})</TabsTrigger>
                <TabsTrigger value="injections">Cultural ({injections.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="trends" className="space-y-4">
                {trends.map((trend) => (
                  <Card key={trend.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{trend.platform.toUpperCase()}</CardTitle>
                        <span className="text-sm font-semibold">{trend.engagement_score} score</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{trend.content}</p>
                      {trend.hashtags && trend.hashtags.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {trend.hashtags.map((tag: string, i: number) => (
                            <span key={i} className="text-xs px-2 py-1 rounded bg-secondary">{tag}</span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="hooks" className="space-y-4">
                {hookOptimizations.map((hook) => (
                  <Card key={hook.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">Hook Optimization</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Original:</p>
                        <p className="text-sm line-through">{hook.original_title}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Optimized:</p>
                        <p className="text-sm font-semibold text-primary">{hook.optimized_title}</p>
                      </div>
                      {hook.predicted_ctr && (
                        <div className="text-sm font-semibold">
                          Predicted CTR: {(hook.predicted_ctr * 100).toFixed(1)}%
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="remixes" className="space-y-4">
                {remixes.map((remix) => (
                  <Card key={remix.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{remix.remix_type} Remix</CardTitle>
                        <span className="text-sm font-semibold">{remix.viral_score} viral score</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{remix.remixed_content}</p>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="injections" className="space-y-4">
                {injections.map((injection) => (
                  <Card key={injection.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg capitalize">{injection.injection_type.replace('_', ' ')}</CardTitle>
                        <span className="text-sm font-semibold">{injection.cultural_relevance_score} relevance</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{injection.injected_content}</p>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </>
  );
};

export default ViralBots;
