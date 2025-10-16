import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Eye, Heart, Share2, MessageCircle, Clock } from "lucide-react";
import { calculateViralScore } from "@/lib/viralOptimization";

type ViralAnalyticsProps = {
  metrics: {
    views?: number;
    likes?: number;
    shares?: number;
    comments?: number;
    watchTime?: number;
  };
  showDetailedMetrics?: boolean;
};

const ViralAnalytics = ({ metrics, showDetailedMetrics = true }: ViralAnalyticsProps) => {
  const viralScore = calculateViralScore(metrics);
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    if (score >= 30) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'VIRAL! 🔥';
    if (score >= 50) return 'Trending 📈';
    if (score >= 30) return 'Growing 🌱';
    return 'Building 🚀';
  };

  const formatNumber = (num: number = 0): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Viral Performance</h3>
        </div>
        <Badge variant="outline" className={`text-lg font-bold ${getScoreColor(viralScore)}`}>
          {getScoreLabel(viralScore)}
        </Badge>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Viral Score</span>
          <span className={`text-2xl font-bold ${getScoreColor(viralScore)}`}>
            {viralScore}/100
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              viralScore >= 80
                ? 'bg-gradient-to-r from-green-400 to-green-600'
                : viralScore >= 50
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                : viralScore >= 30
                ? 'bg-gradient-to-r from-orange-400 to-orange-600'
                : 'bg-gradient-to-r from-red-400 to-red-600'
            }`}
            style={{ width: `${viralScore}%` }}
          />
        </div>
      </div>

      {showDetailedMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Views</p>
              <p className="text-lg font-bold">{formatNumber(metrics.views)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Likes</p>
              <p className="text-lg font-bold">{formatNumber(metrics.likes)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Shares</p>
              <p className="text-lg font-bold">{formatNumber(metrics.shares)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Comments</p>
              <p className="text-lg font-bold">{formatNumber(metrics.comments)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Watch Time</p>
              <p className="text-lg font-bold">{formatNumber(metrics.watchTime)}m</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ViralAnalytics;
