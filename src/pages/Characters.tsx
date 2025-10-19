import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

const Characters = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [characters, setCharacters] = useState<any[]>([]);
  const { toast } = useToast();
  const projectId = searchParams.get('projectId');

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      if (projectId) {
        const { data } = await supabase
          .from('characters')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });
        
        if (data) setCharacters(data);
      }
      
      setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) navigate('/auth');
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, projectId]);

  const handleGenerateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please describe the character you want to create",
        variant: "destructive"
      });
      return;
    }

    if (!projectId) {
      toast({
        title: "Project required",
        description: "Please select a project first",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-character-designer', {
        body: { prompt, projectId }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Character created!",
          description: `${data.character.name} has been added to your project`,
        });
        setCharacters(prev => [data.character, ...prev]);
        setPrompt('');
      }
    } catch (error) {
      console.error('Error generating character:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to create character",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-accent to-primary-glow bg-clip-text text-transparent">
              AI Character Designer
            </h1>
            <p className="text-muted-foreground text-xl">
              Describe any character. Watch them come to life.
            </p>
          </div>

          <Card className="p-8 bg-gradient-to-br from-card to-card/50 border-primary/20 shadow-xl">
            <form onSubmit={handleGenerateCharacter} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="prompt" className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Character Prompt
                </Label>
                <Input 
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A battle-hardened space marine with a mysterious past and a code of honor..."
                  className="bg-background border-primary/30 text-lg py-6 focus:border-primary transition-all"
                  disabled={generating}
                />
                <p className="text-sm text-muted-foreground">
                  Examples: "A witty tech genius who lost everything in a corporate war" • "A young healer from a forgotten kingdom seeking redemption"
                </p>
              </div>

              <Button 
                type="submit"
                disabled={generating || !prompt.trim()}
                className="w-full bg-gradient-to-r from-primary via-accent to-primary-glow hover:opacity-90 text-lg py-6 transition-all shadow-lg hover:shadow-primary/50"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Designing Character...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Character
                  </>
                )}
              </Button>
            </form>
          </Card>

          {characters.length > 0 && (
            <div className="mt-12">
              <h2 className="text-3xl font-bold mb-6">Your Characters</h2>
              <div className="grid gap-4">
                {characters.map((char) => (
                  <Card key={char.id} className="p-6 bg-card border-border hover:border-primary/30 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold">{char.name}</h3>
                        <p className="text-muted-foreground">{char.role} • Age {char.age || 'Unknown'}</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-semibold text-primary">Personality:</span>
                        <p className="text-muted-foreground mt-1">{char.personality}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-accent">Background:</span>
                        <p className="text-muted-foreground mt-1">{char.background}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-primary-glow">Goals:</span>
                        <p className="text-muted-foreground mt-1">{char.goals}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Characters;
