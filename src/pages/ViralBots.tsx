import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import SEOHead from "@/components/SEOHead";
import { BotCategory } from "@/components/BotCategory";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { TrendingUp, DollarSign, Wand2, BarChart3, Bot, Zap, Rocket } from "lucide-react";

interface BotType {
  id: string;
  name: string;
  bot_type: string;
  is_active: boolean;
  updated_at: string;
}

const ViralBots = () => {
  const { toast } = useToast();
  const [bots, setBots] = useState<BotType[]>([]);
  const [runningBots, setRunningBots] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchBots();
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

    const allBotTypes = [
      { type: 'ultra_video' as const, name: 'Ultra Video Bot', category: 'production' },
      { type: 'trend_detection' as const, name: 'Trend Detection Bot', category: 'viral' },
      { type: 'hook_optimization' as const, name: 'Hook Optimization Bot', category: 'viral' },
      { type: 'remix' as const, name: 'Remix Bot', category: 'viral' },
      { type: 'cultural_injection' as const, name: 'Cultural Injection Bot', category: 'viral' },
      { type: 'cross_platform_poster' as const, name: 'Cross-Platform Poster', category: 'growth' },
      { type: 'multi_channel_uploader' as const, name: 'Multi-Channel Uploader', category: 'growth' },
      { type: 'engagement_amplifier' as const, name: 'Engagement Amplifier', category: 'growth' },
      { type: 'live_view_booster' as const, name: 'Live View Booster', category: 'growth' },
      { type: 'affiliate_bot' as const, name: 'Affiliate Bot', category: 'monetization' },
      { type: 'lead_capture' as const, name: 'Lead Capture Bot', category: 'monetization' },
      { type: 'sales_funnel' as const, name: 'Sales Funnel Bot', category: 'monetization' },
      { type: 'digital_product' as const, name: 'Digital Product Bot', category: 'monetization' },
      { type: 'script_generator' as const, name: 'Script Generator Bot', category: 'creator' },
      { type: 'thumbnail_designer' as const, name: 'Thumbnail Designer Bot', category: 'creator' },
      { type: 'video_assembly' as const, name: 'Video Assembly Bot', category: 'creator' },
      { type: 'voiceover' as const, name: 'Voiceover Bot', category: 'creator' },
      { type: 'performance_tracker' as const, name: 'Performance Tracker Bot', category: 'analytics' },
      { type: 'ab_testing' as const, name: 'A/B Testing Bot', category: 'analytics' },
      { type: 'roi_analyzer' as const, name: 'ROI Analyzer Bot', category: 'analytics' },
      { type: 'feedback_loop' as const, name: 'Feedback Loop Bot', category: 'analytics' },
      { type: 'llm_reflection' as const, name: 'LLM Reflection Bot', category: 'ai_agents' },
      { type: 'bot_orchestrator' as const, name: 'Bot Army Orchestrator', category: 'ai_agents' },
      { type: 'persona_bot' as const, name: 'Persona Bot', category: 'ai_agents' },
    ];

    const defaultBots = allBotTypes.map(bot => ({
      user_id: user.id,
      bot_type: bot.type as any, // Type will be updated after migration
      name: bot.name,
      is_active: bot.category === 'viral' || bot.category === 'creator' || bot.category === 'production',
    }));

    const { error } = await supabase.from('viral_bots').insert(defaultBots);
    
    if (!error) {
      fetchBots();
    }
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

  const runBot = async (bot: BotType) => {
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

    const functionMap: Record<string, string> = {
      ultra_video: 'ultra-video-bot',
      trend_detection: 'trend-detection-bot',
      hook_optimization: 'hook-optimization-bot',
      remix: 'remix-bot',
      cultural_injection: 'cultural-injection-bot',
      script_generator: 'script-generator-bot',
      performance_tracker: 'performance-tracker-bot',
      cross_platform_poster: 'cross-platform-poster',
      bot_orchestrator: 'bot-orchestrator',
    };

    const functionName = functionMap[bot.bot_type];

    if (!functionName) {
      toast({
        title: "Coming Soon",
        description: `${bot.name} is being developed`,
      });
      setRunningBots(prev => {
        const newSet = new Set(prev);
        newSet.delete(bot.id);
        return newSet;
      });
      return;
    }

    const payload: any = { bot_id: bot.id };
    
    if (bot.bot_type === 'ultra_video') {
      payload.episodeId = 'latest';
      payload.enhancementLevel = 'ultra';
    } else if (bot.bot_type === 'hook_optimization') {
      payload.content_title = 'My Awesome Video';
      payload.content_description = 'This is an amazing video!';
    } else if (bot.bot_type === 'remix' || bot.bot_type === 'cultural_injection') {
      payload.source_content = 'Create engaging viral content';
      payload.original_content = 'Check out this amazing content!';
    } else if (bot.bot_type === 'script_generator') {
      payload.topic = 'Viral content creation';
      payload.script_type = 'short_form';
      payload.duration = '60-second';
    } else if (bot.bot_type === 'cross_platform_poster') {
      payload.content = 'Check out my latest content!';
      payload.platforms = ['youtube', 'tiktok', 'instagram'];
    } else if (bot.bot_type === 'bot_orchestrator') {
      payload.campaign_type = 'full_viral_campaign';
      payload.topic = 'Trending viral content';
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
      description: `${bot.name} executed successfully`,
    });
  };

  const getBotDescription = (type: string): string => {
    const descriptions: Record<string, string> = {
      ultra_video: 'Advanced AI video generation surpassing Leonardo & Kling - Ultra-realistic, cinematic quality with Claude Sonnet 4.5 scene analysis and multi-pass generation',
      trend_detection: 'Scrapes platforms for rising trends, hashtags, and viral formats',
      hook_optimization: 'Refines titles and descriptions for maximum CTR',
      remix: 'Auto-generates memes, duets, and viral remixes',
      cultural_injection: 'Adds humor and cultural relevance to boost engagement',
      cross_platform_poster: 'Schedules posts across YouTube, TikTok, Instagram, X, LinkedIn',
      multi_channel_uploader: 'Uploads videos, shorts, reels with optimized metadata',
      engagement_amplifier: 'Triggers algorithmic boosts through strategic engagement',
      live_view_booster: 'Increases concurrent viewers during livestreams',
      affiliate_bot: 'Promotes products and tracks affiliate commissions',
      lead_capture: 'Funnels viewers into email lists and landing pages',
      sales_funnel: 'Guides users through purchase decisions with CTAs',
      digital_product: 'Delivers templates and guides post-purchase',
      script_generator: 'Writes viral scripts, captions, and voiceovers',
      thumbnail_designer: 'Auto-generates eye-catching thumbnails',
      video_assembly: 'Combines clips and overlays into polished content',
      voiceover: 'Adds narration using AI voices',
      performance_tracker: 'Monitors watch time, CTR, retention, conversions',
      ab_testing: 'Posts variations and compares performance',
      roi_analyzer: 'Calculates profitability across platforms',
      feedback_loop: 'Uses engagement data to refine strategy',
      llm_reflection: 'Reviews bot output and suggests improvements',
      bot_orchestrator: 'Coordinates multiple bots for synchronized campaigns',
      persona_bot: 'Adopts specific tones and brand voices',
    };
    return descriptions[type] || 'AI-powered automation bot';
  };

  const productionBots = bots.filter(b => ['ultra_video'].includes(b.bot_type));
  const viralBots = bots.filter(b => ['trend_detection', 'hook_optimization', 'remix', 'cultural_injection'].includes(b.bot_type));
  const growthBots = bots.filter(b => ['cross_platform_poster', 'multi_channel_uploader', 'engagement_amplifier', 'live_view_booster'].includes(b.bot_type));
  const monetizationBots = bots.filter(b => ['affiliate_bot', 'lead_capture', 'sales_funnel', 'digital_product'].includes(b.bot_type));
  const creatorBots = bots.filter(b => ['script_generator', 'thumbnail_designer', 'video_assembly', 'voiceover'].includes(b.bot_type));
  const analyticsBots = bots.filter(b => ['performance_tracker', 'ab_testing', 'roi_analyzer', 'feedback_loop'].includes(b.bot_type));
  const aiAgentBots = bots.filter(b => ['llm_reflection', 'bot_orchestrator', 'persona_bot'].includes(b.bot_type));

  return (
    <>
      <SEOHead
        title="Viral Bot Army - Complete Automation Suite"
        description="Automate your entire content empire with 23+ AI-powered bots for virality, growth, monetization, and analytics"
      />
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Viral Bot Army
              </h1>
              <p className="text-muted-foreground text-xl">
                23+ AI-Powered Bots Running Your Content Empire
              </p>
              <div className="flex justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span>{bots.filter(b => b.is_active).length} Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full" />
                  <span>{bots.filter(b => !b.is_active).length} Inactive</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <BotCategory
                title="🎬 Ultra Production"
                description="Advanced AI video generation that surpasses Leonardo & Kling with multi-pass generation"
                icon={<Bot className="h-8 w-8 text-purple-600" />}
                bots={productionBots}
                runningBots={runningBots}
                onToggle={toggleBot}
                onRun={runBot}
                getBotDescription={getBotDescription}
              />

              <BotCategory
                title="Virality & Trend Bots"
                description="Detect trends and optimize content for maximum viral potential"
                icon={<TrendingUp className="h-8 w-8 text-primary" />}
                bots={viralBots}
                runningBots={runningBots}
                onToggle={toggleBot}
                onRun={runBot}
                getBotDescription={getBotDescription}
              />

              <BotCategory
                title="Growth & Distribution Bots"
                description="Scale reach across all platforms with automated posting and engagement"
                icon={<Rocket className="h-8 w-8 text-green-600" />}
                bots={growthBots}
                runningBots={runningBots}
                onToggle={toggleBot}
                onRun={runBot}
                getBotDescription={getBotDescription}
              />

              <BotCategory
                title="Monetization & Lead Gen Bots"
                description="Convert views into revenue with affiliate tracking and sales funnels"
                icon={<DollarSign className="h-8 w-8 text-yellow-600" />}
                bots={monetizationBots}
                runningBots={runningBots}
                onToggle={toggleBot}
                onRun={runBot}
                getBotDescription={getBotDescription}
              />

              <BotCategory
                title="Creator & Asset Bots"
                description="Generate scripts, thumbnails, and complete video assemblies"
                icon={<Wand2 className="h-8 w-8 text-purple-600" />}
                bots={creatorBots}
                runningBots={runningBots}
                onToggle={toggleBot}
                onRun={runBot}
                getBotDescription={getBotDescription}
              />

              <BotCategory
                title="Analytics & Optimization Bots"
                description="Track performance and optimize ROI with data-driven insights"
                icon={<BarChart3 className="h-8 w-8 text-blue-600" />}
                bots={analyticsBots}
                runningBots={runningBots}
                onToggle={toggleBot}
                onRun={runBot}
                getBotDescription={getBotDescription}
              />

              <BotCategory
                title="AI Agents & Autonomous Systems"
                description="Self-improving bots that coordinate and optimize the entire operation"
                icon={<Zap className="h-8 w-8 text-orange-600" />}
                bots={aiAgentBots}
                runningBots={runningBots}
                onToggle={toggleBot}
                onRun={runBot}
                getBotDescription={getBotDescription}
              />
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default ViralBots;
