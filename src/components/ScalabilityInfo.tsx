import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Zap, Database, Cloud, Lock, TrendingUp } from 'lucide-react';

export const ScalabilityInfo = () => {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <CardTitle>Auto-Scaling Infrastructure</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Your app runs on Lovable Cloud with enterprise-grade auto-scaling capabilities:
        </p>

        <div className="grid gap-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border">
            <Cloud className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">Serverless Backend</span>
                <Badge variant="outline" className="text-xs">Auto-scales</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Edge functions automatically scale from 0 to millions of requests
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border">
            <Database className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">Managed Database</span>
                <Badge variant="outline" className="text-xs">High Performance</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                PostgreSQL with automatic connection pooling and read replicas
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border">
            <TrendingUp className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">Background Processing</span>
                <Badge variant="outline" className="text-xs">Optimized</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Video generation runs in background with batching and retry logic
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border">
            <Lock className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">Secure Storage</span>
                <Badge variant="outline" className="text-xs">Unlimited</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                CDN-backed file storage with automatic caching and global distribution
              </p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Scales automatically based on demand - no configuration needed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
