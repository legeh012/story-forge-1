import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, Video, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSmartErrorRecovery } from '@/hooks/useSmartErrorRecovery';
import { SmartLoadingState } from './SmartLoadingState';

interface PromptGeneratorProps {
  projectId: string;
  onEpisodeGenerated?: () => void;
}

export const PromptGenerator = ({ projectId, onEpisodeGenerated }: PromptGeneratorProps) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { withRecovery } = useSmartErrorRecovery();

  const promptSuggestions = [
    "Lucky presents her revolutionary schema design to skeptical investors",
    "Luul hosts a confessional where ancestral truths are revealed",
    "Samara and Ayaan clash over strategic decisions for the next episode",
    "Zahra's satirical commentary on trending cultural moments goes viral",
    "Nasra opens up about her emotional journey with the cast",
    "Amal instigates chaos at a glamorous cast event"
  ];

  const generateEpisode = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Prompt required',
        description: 'Please enter a prompt to generate an episode',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    await withRecovery(
      async () => {
        console.log('Generating episode from prompt:', prompt);
        
        toast({
          title: 'AI Episode Generator',
          description: 'Creating 3 clips with production-grade quality...',
        });

        const { data, error } = await supabase.functions.invoke('generate-episode-from-prompt', {
          body: {
            projectId,
            prompt: prompt.trim(),
          },
        });

        if (error) throw error;

        console.log('Episode generated:', data);

        toast({
          title: 'Episode generated successfully!',
          description: data?.message || 'Your episode with 3 cinematic clips is ready. Check the Episodes page!',
        });

        setPrompt('');
        onEpisodeGenerated?.();
      },
      {
        component: 'PromptGenerator',
        action: 'generateEpisode',
        maxRetries: 2,
        onFailure: () => setIsGenerating(false)
      }
    );

    setIsGenerating(false);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>AI Episode Generator</CardTitle>
            <CardDescription>
              Generate complete episodes with 3 clips from a simple prompt
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="episode-prompt">Episode Prompt</Label>
          <Textarea
            id="episode-prompt"
            placeholder="Example: Lucky unveils her latest vision while Zahra provides satirical commentary, and Luul shares ancestral wisdom that changes everything..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="resize-none"
            disabled={isGenerating}
          />
          
          {/* Quick Suggestions */}
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-muted-foreground mt-1" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-2">Quick ideas:</p>
              <div className="flex flex-wrap gap-2">
                {promptSuggestions.map((suggestion, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-1"
                    onClick={() => setPrompt(suggestion)}
                    disabled={isGenerating}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            The AI will generate a full episode with the Say Walahi cast (Lucky, Luul, Samara, Ayaan, Hani, Zahra, Nasra, Amal) featuring script, synopsis, and 3 cinematic clips
          </p>
        </div>

        <Button
          onClick={generateEpisode}
          disabled={isGenerating || !prompt.trim()}
          className="w-full bg-gradient-to-r from-primary via-accent to-primary-glow"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Episode...
            </>
          ) : (
            <>
              <Video className="h-4 w-4 mr-2" />
              Generate Episode with 3 Clips
            </>
          )}
        </Button>

        {isGenerating && (
          <SmartLoadingState 
            operation="generating-episode"
            message="Creating your episode with AI-powered production"
          />
        )}
      </CardContent>
    </Card>
  );
};
