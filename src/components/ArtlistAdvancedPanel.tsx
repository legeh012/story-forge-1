import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Film, Palette, Scissors, TrendingUp, Loader2 } from 'lucide-react';

interface ArtlistAdvancedPanelProps {
  episodeId?: string;
}

export const ArtlistAdvancedPanel = ({ episodeId }: ArtlistAdvancedPanelProps) => {
  const { toast } = useToast();
  const [runningMode, setRunningMode] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [results, setResults] = useState<Record<string, any>>({});

  const runArtlistBot = async (mode: string) => {
    if (!episodeId) {
      toast({
        title: "No Episode Selected",
        description: "Please select an episode first",
        variant: "destructive",
      });
      return;
    }

    setRunningMode(mode);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('artlist-advanced-bot', {
        body: {
          episodeId,
          mode,
          customPrompt: customPrompt || undefined,
        },
      });

      if (error) throw error;

      setResults(prev => ({ ...prev, [mode]: data.results }));
      
      toast({
        title: "✨ Artlist Bot Complete",
        description: `${getModeLabel(mode)} finished successfully`,
      });

    } catch (error) {
      console.error('Artlist Bot Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to run Artlist bot',
        variant: "destructive",
      });
    } finally {
      setRunningMode(null);
    }
  };

  const getModeLabel = (mode: string) => {
    const labels: Record<string, string> = {
      'full_production': 'Full Production',
      'scene_analysis': 'Scene Analysis',
      'color_grade': 'Color Grading',
      'smart_editing': 'Smart Editing',
      'content_optimization': 'Content Optimization',
    };
    return labels[mode] || mode;
  };

  const getModeIcon = (mode: string) => {
    const icons: Record<string, any> = {
      'full_production': Sparkles,
      'scene_analysis': Film,
      'color_grade': Palette,
      'smart_editing': Scissors,
      'content_optimization': TrendingUp,
    };
    return icons[mode] || Sparkles;
  };

  const getModeDescription = (mode: string) => {
    const descriptions: Record<string, string> = {
      'full_production': 'Complete AI production workflow with scene analysis, editing, color grading & optimization',
      'scene_analysis': 'Advanced scene breakdown with emotional arc mapping and pacing analysis',
      'color_grade': 'Professional color grading with LUT recommendations and emotional color mapping',
      'smart_editing': 'Intelligent editing with cut timing, B-roll placement, and music cues',
      'content_optimization': 'Maximize engagement with viral moment identification and platform optimization',
    };
    return descriptions[mode] || '';
  };

  const getModeFeatures = (mode: string) => {
    const features: Record<string, string[]> = {
      'full_production': ['Scene Analysis', 'Smart Editing', 'Color Grading', 'Content Optimization'],
      'scene_analysis': ['Scene breakdown', 'Emotional arc', 'Pacing', 'Transitions', 'Retention'],
      'color_grade': ['Color scheme', 'Adjustments', 'LUTs', 'Scene grading', 'Emotional colors'],
      'smart_editing': ['Cut timing', 'B-roll points', 'Music cues', 'Effects', 'Pacing'],
      'content_optimization': ['Hook analysis', 'Cliffhangers', 'Viral moments', 'Platform adapt', 'Retention'],
    };
    return features[mode] || [];
  };

  const modes = [
    'full_production',
    'scene_analysis',
    'color_grade',
    'smart_editing',
    'content_optimization',
  ];

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <CardTitle>Artlist Advanced AI Studio</CardTitle>
          </div>
          <CardDescription>
            Professional-grade AI tools for video production - 5 powerful modes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* All 5 Mode Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modes.map((mode) => {
              const Icon = getModeIcon(mode);
              const isRunning = runningMode === mode;
              const hasResults = !!results[mode];

              return (
                <Card 
                  key={mode}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    isRunning ? 'border-primary border-2' : 'border-muted'
                  } ${hasResults ? 'bg-primary/5' : ''}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${isRunning ? 'text-primary animate-pulse' : 'text-primary'}`} />
                      <CardTitle className="text-base">{getModeLabel(mode)}</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      {getModeDescription(mode)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {getModeFeatures(mode).slice(0, 3).map((feature, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    
                    <Button
                      onClick={() => runArtlistBot(mode)}
                      disabled={!!runningMode || !episodeId}
                      className="w-full"
                      size="sm"
                    >
                      {isRunning ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Processing...
                        </>
                      ) : hasResults ? (
                        <>
                          <Sparkles className="mr-2 h-3 w-3" />
                          Run Again
                        </>
                      ) : (
                        <>
                          <Icon className="mr-2 h-3 w-3" />
                          Activate
                        </>
                      )}
                    </Button>

                    {hasResults && (
                      <div className="text-xs text-primary font-medium">
                        ✓ Completed
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Custom Prompt */}
          <div className="space-y-2 pt-4 border-t">
            <label className="text-sm font-medium">Custom AI Instructions (Optional)</label>
            <Textarea
              placeholder="Add custom instructions for any mode (e.g., 'Focus on suspenseful moments' or 'Optimize for TikTok')"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          {/* Results Display */}
          {Object.keys(results).length > 0 && (
            <Card className="bg-muted/50 border-t">
              <CardHeader>
                <CardTitle className="text-sm">Recent Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(results).map(([mode, result]) => (
                  <details key={mode} className="group">
                    <summary className="cursor-pointer text-sm font-medium hover:text-primary flex items-center gap-2">
                      <span>▸</span>
                      {getModeLabel(mode)}
                    </summary>
                    <pre className="text-xs overflow-auto max-h-64 bg-background p-3 rounded-md mt-2">
                      {JSON.stringify(result.enhancements, null, 2)}
                    </pre>
                  </details>
                ))}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
