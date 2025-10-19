import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, AlertTriangle, Zap, Film, Sparkles } from 'lucide-react';

interface ProductionStats {
  totalEpisodes: number;
  renderingEpisodes: number;
  completedEpisodes: number;
  failedEpisodes: number;
}

interface ProductionDashboardProps {
  stats: ProductionStats;
  recentActivity?: Array<{
    type: string;
    message: string;
    timestamp: string;
    status: 'success' | 'pending' | 'error';
  }>;
}

export const ProductionDashboard = ({ stats, recentActivity = [] }: ProductionDashboardProps) => {
  const completionRate = stats.totalEpisodes > 0 
    ? Math.round((stats.completedEpisodes / stats.totalEpisodes) * 100) 
    : 0;

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Production Pipeline</CardTitle>
              <CardDescription>Netflix-grade cinematic asset generation</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalEpisodes}</p>
            </div>

            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Rendering</span>
              </div>
              <p className="text-2xl font-bold text-blue-500">{stats.renderingEpisodes}</p>
            </div>

            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Complete</span>
              </div>
              <p className="text-2xl font-bold text-green-500">{stats.completedEpisodes}</p>
            </div>

            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-muted-foreground">Failed</span>
              </div>
              <p className="text-2xl font-bold text-red-500">{stats.failedEpisodes}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Completion Rate</span>
              <span className="font-semibold text-primary">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>

          {recentActivity.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-border">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Recent Activity
              </h4>
              <div className="space-y-2">
                {recentActivity.slice(0, 5).map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <Badge 
                      variant={activity.status === 'success' ? 'default' : activity.status === 'error' ? 'destructive' : 'outline'}
                      className="shrink-0"
                    >
                      {activity.type}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-muted-foreground">{activity.message}</p>
                      <p className="text-xs text-muted-foreground/60">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};