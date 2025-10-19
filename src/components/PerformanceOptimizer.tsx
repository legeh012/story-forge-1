import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Zap, TrendingUp, Loader2 } from 'lucide-react';

export const PerformanceOptimizer = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [godMode, setGodMode] = useState(false);
  const { toast } = useToast();

  const analyzePerformance = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('performance-optimizer-bot', {
        body: { action: 'analyze', target: 'all' }
      });

      if (error) throw error;

      setResults(data);
      setGodMode(data.godMode || false);
      toast({
        title: '⚡ GODLIKE Analysis Complete',
        description: `Found ${data.analysis.suggestions.optimizations.length} extreme optimizations - ${data.analysis.projectedSpeedUp} possible!`
      });
    } catch (error) {
      toast({
        title: 'Analysis Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const applyOptimizations = async () => {
    setOptimizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('performance-optimizer-bot', {
        body: { action: 'optimize', target: 'all' }
      });

      if (error) throw error;

      setResults(data);
      setGodMode(data.godMode || false);
      toast({
        title: '⚡ GODMODE ACTIVATED',
        description: data.message
      });
    } catch (error) {
      toast({
        title: 'Optimization Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className={`h-5 w-5 ${godMode ? 'text-yellow-400 animate-pulse' : 'text-primary'}`} />
          <CardTitle>{godMode ? '⚡ GODLIKE' : 'AI'} Performance Optimizer</CardTitle>
          {godMode && <Badge variant="default" className="bg-yellow-500">GOD MODE</Badge>}
        </div>
        <CardDescription>
          {godMode ? 'Ultra-aggressive performance optimization - 50x+ speed boost' : 'Analyze and optimize backend performance automatically'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={analyzePerformance} 
            disabled={analyzing || optimizing}
            variant="outline"
          >
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Analyze Performance
          </Button>
          <Button 
            onClick={applyOptimizations} 
            disabled={analyzing || optimizing}
          >
            {optimizing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Apply Optimizations
          </Button>
        </div>

        {results && (
          <div className="space-y-3">
            {results.metrics && (
              <div className="grid grid-cols-2 gap-2 p-3 bg-secondary/20 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Before</p>
                  <p className="text-lg font-bold">{results.metrics.beforeOptimization}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Projected After</p>
                  <p className="text-lg font-bold text-primary">{results.metrics.projectedAfter}</p>
                </div>
              </div>
            )}
            
            {results.estimatedSpeedUp && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${godMode ? 'bg-yellow-500/20' : 'bg-primary/10'}`}>
                <TrendingUp className={`h-5 w-5 ${godMode ? 'text-yellow-400' : 'text-primary'}`} />
                <span className="font-semibold">
                  {results.estimatedSpeedUp}x faster performance {godMode ? '⚡ GODLIKE' : 'expected'}
                </span>
              </div>
            )}

            {results.analysis?.suggestions?.optimizations && (
              <div className="space-y-2">
                <h4 className="font-semibold">Optimization Opportunities:</h4>
                {results.analysis.suggestions.optimizations.map((opt: any, idx: number) => (
                  <div key={idx} className="p-3 border rounded-lg space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={opt.impact === 'extreme' || opt.impact === 'high' ? 'default' : 'secondary'}>
                        {opt.type}
                      </Badge>
                      <Badge variant="outline" className={opt.impact === 'extreme' ? 'border-yellow-500 text-yellow-500' : ''}>
                        {opt.impact} impact {opt.speedMultiplier ? `(${opt.speedMultiplier}x)` : ''}
                      </Badge>
                    </div>
                    <p className="text-sm">{opt.description}</p>
                    {opt.implementation && <p className="text-xs text-muted-foreground">{opt.implementation}</p>}
                  </div>
                ))}
              </div>
            )}

            {results.optimizations && (
              <div className="space-y-2">
                <h4 className="font-semibold">Applied Optimizations:</h4>
                {results.optimizations.map((opt: any, idx: number) => (
                  <div key={idx} className="p-2 border rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{opt.type}</span>
                      {opt.config?.speedMultiplier && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {opt.config.speedMultiplier}x boost
                        </span>
                      )}
                    </div>
                    <Badge variant={opt.status === 'GODMODE_ACTIVE' ? 'default' : 'secondary'}>
                      {opt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
