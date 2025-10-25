import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [isRunning, setIsRunning] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [results, setResults] = useState<any>(null);

  const runArtlistBot = async (mode: string) => {
    if (!episodeId) {
      toast({
        title: "No Episode Selected",
        description: "Please select an episode first",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    setResults(null);

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

      setResults(data.results);
      
      toast({
        title: "✨ Artlist Advanced Bot Complete",
        description: `${mode} mode finished successfully`,
      });

    } catch (error) {
      console.error('Artlist Bot Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to run Artlist bot',
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <CardTitle>Artlist Advanced AI Studio</CardTitle>
          </div>
          <CardDescription>
            Professional-grade AI tools for video production, inspired by industry-leading platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="full" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="full">Full Production</TabsTrigger>
              <TabsTrigger value="scene">Scene Analysis</TabsTrigger>
              <TabsTrigger value="color">Color Grade</TabsTrigger>
              <TabsTrigger value="edit">Smart Edit</TabsTrigger>
              <TabsTrigger value="optimize">Optimize</TabsTrigger>
            </TabsList>

            <TabsContent value="full" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Film className="h-5 w-5 text-primary" />
                  Full Production Pipeline
                </h3>
                <p className="text-sm text-muted-foreground">
                  Complete AI-powered production workflow: scene analysis, smart editing, color grading, and content optimization
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary">Scene Analysis</Badge>
                  <Badge variant="secondary">Smart Editing</Badge>
                  <Badge variant="secondary">Color Grading</Badge>
                  <Badge variant="secondary">Content Optimization</Badge>
                </div>
                <Button
                  onClick={() => runArtlistBot('full_production')}
                  disabled={isRunning || !episodeId}
                  className="w-full mt-4"
                  size="lg"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Run Full Production
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="scene" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Film className="h-5 w-5 text-primary" />
                  AI Scene Analysis
                </h3>
                <p className="text-sm text-muted-foreground">
                  Advanced scene breakdown with emotional arc mapping, pacing analysis, and key moment identification
                </p>
                <ul className="text-sm space-y-1 mt-2">
                  <li>• Scene breakdown with timestamps</li>
                  <li>• Emotional arc mapping</li>
                  <li>• Pacing recommendations</li>
                  <li>• Transition suggestions</li>
                  <li>• Audience retention points</li>
                </ul>
                <Button
                  onClick={() => runArtlistBot('scene_analysis')}
                  disabled={isRunning || !episodeId}
                  className="w-full mt-4"
                >
                  {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Film className="mr-2 h-4 w-4" />}
                  Analyze Scenes
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="color" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  AI Color Grading
                </h3>
                <p className="text-sm text-muted-foreground">
                  Professional color grading with LUT recommendations and emotional color mapping
                </p>
                <ul className="text-sm space-y-1 mt-2">
                  <li>• Primary color scheme design</li>
                  <li>• Shadows/midtones/highlights</li>
                  <li>• LUT recommendations</li>
                  <li>• Scene-specific grading</li>
                  <li>• Emotional color mapping</li>
                </ul>
                <Button
                  onClick={() => runArtlistBot('color_grade')}
                  disabled={isRunning || !episodeId}
                  className="w-full mt-4"
                >
                  {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Palette className="mr-2 h-4 w-4" />}
                  Generate Color Grade
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="edit" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Scissors className="h-5 w-5 text-primary" />
                  Smart Editing AI
                </h3>
                <p className="text-sm text-muted-foreground">
                  Intelligent editing suggestions with precise cut timing and B-roll placement
                </p>
                <ul className="text-sm space-y-1 mt-2">
                  <li>• Cut timing precision</li>
                  <li>• B-roll insertion points</li>
                  <li>• Music cue placements</li>
                  <li>• Sound effect triggers</li>
                  <li>• Pacing adjustments</li>
                </ul>
                <Button
                  onClick={() => runArtlistBot('smart_editing')}
                  disabled={isRunning || !episodeId}
                  className="w-full mt-4"
                >
                  {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Scissors className="mr-2 h-4 w-4" />}
                  Generate Edit Suggestions
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="optimize" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Content Optimization
                </h3>
                <p className="text-sm text-muted-foreground">
                  Maximize engagement with viral moment identification and platform-specific optimization
                </p>
                <ul className="text-sm space-y-1 mt-2">
                  <li>• Hook strength analysis</li>
                  <li>• Cliffhanger placement</li>
                  <li>• Viral moment identification</li>
                  <li>• Platform adaptations (TikTok, YouTube, IG)</li>
                  <li>• Retention strategy</li>
                </ul>
                <Button
                  onClick={() => runArtlistBot('content_optimization')}
                  disabled={isRunning || !episodeId}
                  className="w-full mt-4"
                >
                  {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrendingUp className="mr-2 h-4 w-4" />}
                  Optimize Content
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 space-y-2">
            <label className="text-sm font-medium">Custom AI Prompt (Optional)</label>
            <Textarea
              placeholder="Add custom instructions for the AI (e.g., 'Add more suspenseful moments' or 'Optimize for TikTok')"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {results && (
            <Card className="mt-6 bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Results</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto max-h-96 bg-background p-4 rounded-md">
                  {JSON.stringify(results.enhancements, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
