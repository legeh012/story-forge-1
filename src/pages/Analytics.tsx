import Navigation from "@/components/Navigation";
import SEOHead from "@/components/SEOHead";
import ViralAnalytics from "@/components/ViralAnalytics";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Youtube, Instagram, Twitter, Facebook, Share2 } from "lucide-react";
import { getContentOptimizationTips, getBestPostingTimes } from "@/lib/viralOptimization";

const Analytics = () => {
  // Sample data - would come from actual analytics in production
  const sampleMetrics = {
    overall: {
      views: 1250000,
      likes: 85000,
      shares: 12500,
      comments: 8900,
      watchTime: 45000,
    },
    youtube: {
      views: 500000,
      likes: 35000,
      shares: 5000,
      comments: 3500,
      watchTime: 20000,
    },
    tiktok: {
      views: 450000,
      likes: 30000,
      shares: 4500,
      comments: 3200,
      watchTime: 15000,
    },
    instagram: {
      views: 300000,
      likes: 20000,
      shares: 3000,
      comments: 2200,
      watchTime: 10000,
    },
  };

  const platforms = [
    { name: 'YouTube', icon: Youtube, color: 'text-[hsl(0_100%_45%)]', metrics: sampleMetrics.youtube },
    { name: 'TikTok', icon: Share2, color: 'text-foreground', metrics: sampleMetrics.tiktok },
    { name: 'Instagram', icon: Instagram, color: 'text-[hsl(330_100%_50%)]', metrics: sampleMetrics.instagram },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Analytics Dashboard - Track Your Viral Performance"
        description="Monitor your viral content performance across YouTube, TikTok, and Instagram. Real-time analytics and optimization tips."
      />
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Viral Analytics Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Track your content performance and maximize viral potential
          </p>
        </div>

        <div className="mb-8">
          <ViralAnalytics metrics={sampleMetrics.overall} showDetailedMetrics={true} />
        </div>

        <Tabs defaultValue="platforms" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="platforms">Platforms</TabsTrigger>
            <TabsTrigger value="optimization">Optimization Tips</TabsTrigger>
            <TabsTrigger value="timing">Best Times to Post</TabsTrigger>
          </TabsList>

          <TabsContent value="platforms" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {platforms.map((platform) => (
                <Card key={platform.name} className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <platform.icon className={`h-6 w-6 ${platform.color}`} />
                    <h3 className="text-xl font-semibold">{platform.name}</h3>
                  </div>
                  <ViralAnalytics 
                    metrics={platform.metrics} 
                    showDetailedMetrics={false} 
                  />
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Views</span>
                      <span className="font-semibold">
                        {(platform.metrics.views || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Engagement</span>
                      <span className="font-semibold">
                        {((platform.metrics.likes || 0) + (platform.metrics.comments || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="optimization" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {['youtube', 'tiktok', 'instagram', 'twitter', 'facebook'].map((platform) => (
                <Card key={platform} className="p-6">
                  <h3 className="text-lg font-semibold mb-4 capitalize flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    {platform} Tips
                  </h3>
                  <ul className="space-y-2">
                    {getContentOptimizationTips(platform).map((tip, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="timing" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {['youtube', 'tiktok', 'instagram', 'twitter', 'facebook'].map((platform) => (
                <Card key={platform} className="p-6">
                  <h3 className="text-lg font-semibold mb-4 capitalize">
                    Best Times for {platform}
                  </h3>
                  <div className="space-y-3">
                    {getBestPostingTimes(platform as any).map((time, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                        <span className="text-sm font-medium">{time}</span>
                        <Button size="sm" variant="outline">
                          Schedule Post
                        </Button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    * Times shown in Eastern Standard Time (EST)
                  </p>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Analytics;
