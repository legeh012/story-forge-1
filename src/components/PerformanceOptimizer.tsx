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
  const { toast } = useToast();

  const analyzePerformance = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('performance-optimizer-bot', {
        body: { action: 'analyze', target: 'all' }
      });

      if (error) throw error;

      setResults(data);
      toast({
        title: 'Analysis Complete',
        description: `Found ${data.analysis.suggestions.optimizations.length} optimization opportunities`
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
      toast({
        title: 'Optimizations Applied',
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
          <Zap className="h-5 w-5 text-primary" />
          <CardTitle>AI Performance Optimizer</CardTitle>
        </div>
        <CardDescription>
          Analyze and optimize backend performance automatically
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
            {results.estimatedSpeedUp && (
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="font-semibold">
                  {results.estimatedSpeedUp}x faster performance expected
                </span>
              </div>
            )}

            {results.analysis?.suggestions?.optimizations && (
              <div className="space-y-2">
                <h4 className="font-semibold">Optimization Opportunities:</h4>
                {results.analysis.suggestions.optimizations.map((opt: any, idx: number) => (
                  <div key={idx} className="p-3 border rounded-lg space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={opt.impact === 'high' ? 'default' : 'secondary'}>
                        {opt.type}
                      </Badge>
                      <Badge variant="outline">{opt.impact} impact</Badge>
                    </div>
                    <p className="text-sm">{opt.description}</p>
                    <p className="text-xs text-muted-foreground">{opt.implementation}</p>
                  </div>
                ))}
              </div>
            )}

            {results.optimizations && (
              <div className="space-y-2">
                <h4 className="font-semibold">Applied Optimizations:</h4>
                {results.optimizations.map((opt: any, idx: number) => (
                  <div key={idx} className="p-2 border rounded-lg flex items-center justify-between">
                    <span className="text-sm">{opt.type}</span>
                    <Badge variant="default">{opt.status}</Badge>
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
