import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Clapperboard, Users, Zap, Play, Loader2, 
  CheckCircle2, TrendingUp, Palette, Film 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ActiveBotsPanelProps {
  episodeId?: string;
}

export const ActiveBotsPanel = ({ episodeId }: ActiveBotsPanelProps) => {
  const [prompt, setPrompt] = useState('');
  const [scenePrompt, setScenePrompt] = useState('');
  const [isRunning, setIsRunning] = useState<string | null>(null);
  const { toast } = useToast();

  const bots = [
    {
      id: 'expert_director',
      name: 'ExpertDirector',
      icon: Clapperboard,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      description: 'Virtual showrunner for cinematic direction',
      features: ['Camera angles', 'Emotional tone', 'Auto-adjusts drama intensity', 'Character focus'],
    },
    {
      id: 'production_team',
      name: 'Production Team',
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      description: 'Casting, styling, and drama editing modules',
      features: ['Character consistency', 'Cultural styling', 'Conflict optimization', 'Preloaded templates'],
    },
    {
      id: 'scene_orchestration',
      name: 'Scene Orchestrator',
      icon: Zap,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      description: '60-80% faster with pre-generated setups',
      features: ['Instant generation', 'Common scene templates', 'Boutique/brunch/reunion presets'],
    },
  ];

  const runExpertDirector = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Prompt required',
        description: 'Enter a creative prompt for the director',
        variant: 'destructive',
      });
      return;
    }

    setIsRunning('expert_director');

    try {
      const { data, error } = await supabase.functions.invoke('expert-director', {
        body: { 
          prompt: prompt.trim(),
          episodeId,
          viewerEngagement: { medium: true }
        },
      });

      if (error) throw error;

      toast({
        title: 'Director Guidance Ready',
        description: `Cinematic direction: ${data.direction.cinematicFlow.substring(0, 100)}...`,
      });
    } catch (error) {
      toast({
        title: 'Director failed',
        description: error instanceof Error ? error.message : 'Failed to run ExpertDirector',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(null);
    }
  };

  const runProductionTeam = async (role: string) => {
    setIsRunning('production_team');

    try {
      const { data, error } = await supabase.functions.invoke('production-team', {
        body: { 
          role,
          sceneData: { 
            prompt: prompt.trim() || 'Sample scene',
            setting: 'boutique',
            characters: ['Character A', 'Character B']
          },
          episodeId
        },
      });

      if (error) throw error;

      toast({
        title: `Production Team (${role.replace('_', ' ')})`,
        description: 'Analysis complete - check console for details',
      });
    } catch (error) {
      toast({
        title: 'Production Team failed',
        description: error instanceof Error ? error.message : 'Failed to run module',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(null);
    }
  };

  const runSceneOrchestration = async () => {
    if (!scenePrompt.trim()) {
      toast({
        title: 'Scene prompt required',
        description: 'Enter a short scene description',
        variant: 'destructive',
      });
      return;
    }

    setIsRunning('scene_orchestration');

    try {
      const { data, error } = await supabase.functions.invoke('scene-orchestration', {
        body: { 
          shortPrompt: scenePrompt.trim(),
          episodeId
        },
      });

      if (error) throw error;

      toast({
        title: 'Scene Generated Instantly!',
        description: `${data.timeSaved} using template: ${data.orchestration.matchedTemplate}`,
      });
    } catch (error) {
      toast({
        title: 'Orchestration failed',
        description: error instanceof Error ? error.message : 'Failed to orchestrate scene',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bots Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bots.map((bot) => (
          <Card key={bot.id} className={`border ${bot.borderColor}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${bot.bgColor}`}>
                  <bot.icon className={`h-5 w-5 ${bot.color}`} />
                </div>
                <div>
                  <CardTitle className="text-base">{bot.name}</CardTitle>
                  <Badge variant="outline" className={bot.color}>
                    Active
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{bot.description}</p>
              <div className="space-y-1.5">
                {bot.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className={`h-3 w-3 ${bot.color}`} />
                    <span className="text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ExpertDirector Interface */}
      <Card className="border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clapperboard className="h-5 w-5 text-purple-500" />
            ExpertDirector Interface
          </CardTitle>
          <CardDescription>
            Get cinematic direction, camera angles, and drama optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="director-prompt">Creative Prompt</Label>
            <Textarea
              id="director-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Create a dramatic confrontation between Amal and Nasra at an upscale boutique, building tension through subtle glances before erupting into argument"
              className="min-h-24"
            />
          </div>
          <Button
            onClick={runExpertDirector}
            disabled={isRunning === 'expert_director'}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600"
          >
            {isRunning === 'expert_director' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Directing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Get Director Guidance
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Production Team Interface */}
      <Card className="border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Production Team Modules
          </CardTitle>
          <CardDescription>
            Specialized AI roles for character, styling, and drama optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={() => runProductionTeam('casting_director')}
              disabled={isRunning === 'production_team'}
              variant="outline"
              className="border-blue-500/30"
            >
              <Film className="h-4 w-4 mr-2" />
              Casting Director
            </Button>
            <Button
              onClick={() => runProductionTeam('scene_stylist')}
              disabled={isRunning === 'production_team'}
              variant="outline"
              className="border-blue-500/30"
            >
              <Palette className="h-4 w-4 mr-2" />
              Scene Stylist
            </Button>
            <Button
              onClick={() => runProductionTeam('drama_editor')}
              disabled={isRunning === 'production_team'}
              variant="outline"
              className="border-blue-500/30"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Drama Editor
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scene Orchestration Interface */}
      <Card className="border-green-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-green-500" />
            Scene Orchestration Engine
          </CardTitle>
          <CardDescription>
            Instant generation from short prompts using pre-loaded templates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="scene-prompt">Short Scene Prompt</Label>
            <Textarea
              id="scene-prompt"
              value={scenePrompt}
              onChange={(e) => setScenePrompt(e.target.value)}
              placeholder='Example: "Amal exposes Nasra at brunch"'
              className="min-h-16"
            />
          </div>
          <Button
            onClick={runSceneOrchestration}
            disabled={isRunning === 'scene_orchestration'}
            className="w-full bg-gradient-to-r from-green-500 to-green-600"
          >
            {isRunning === 'scene_orchestration' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Orchestrating...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Generate Scene Instantly
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            ⚡ 60-80% faster using pre-generated templates
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
