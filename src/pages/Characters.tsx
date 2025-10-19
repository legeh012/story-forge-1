import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Upload } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { sayWalahiCharacters } from "@/data/sayWalahiCharacters";

const Characters = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [importing, setImporting] = useState(false);
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
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to create character",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleImportSayWalahi = async () => {
    if (!projectId) {
      toast({
        title: "Project required",
        description: "Please select a project first",
        variant: "destructive"
      });
      return;
    }

    setImporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('import-characters', {
        body: { 
          characters: sayWalahiCharacters,
          projectId 
        }
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Imported ${data.imported} Say Walahi characters`,
      });

      // Refresh characters list
      const { data: updatedChars } = await supabase
        .from('characters')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (updatedChars) setCharacters(updatedChars);
      
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import characters",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
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
                <p className="text-sm text-muted-foreground space-y-1">
                  <span className="block">💅 "Create a boutique queen named Zahra who leaks screenshots and wears gold abayas"</span>
                  <span className="block">🎭 "Make a shady newcomer named Amal who narrates drama in glam confessionals"</span>
                  <span className="block">👩‍👧 "Create a protective mom named Hani who breaks down over gang rumors"</span>
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  type="submit"
                  disabled={generating || !prompt.trim()}
                  className="flex-1 bg-gradient-to-r from-primary via-accent to-primary-glow hover:opacity-90 text-lg py-6 transition-all shadow-lg hover:shadow-primary/50"
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
                
                <Button 
                  type="button"
                  onClick={handleImportSayWalahi}
                  disabled={importing || !projectId}
                  variant="outline"
                  className="border-primary/30 hover:bg-primary/10 text-lg py-6 px-6"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mr-2" />
                      Import Say Walahis
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>

          {characters.length > 0 && (
            <div className="mt-12">
              <h2 className="text-3xl font-bold mb-6">Your Characters</h2>
              <div className="grid gap-6">
                {characters.map((char) => {
                  const appearance = char.metadata?.appearance || {};
                  const dramaHooks = char.metadata?.drama_hooks || [];
                  const emotionalTags = char.metadata?.emotional_tags || [];
                  
                  return (
                    <Card key={char.id} className="overflow-hidden border-primary/20 hover:border-primary/40 transition-all shadow-lg">
                      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary-glow/10 p-6 border-b border-border">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-3xl font-bold">{char.name}</h3>
                            <p className="text-lg text-muted-foreground mt-1">{char.role}</p>
                          </div>
                          {char.age && (
                            <div className="text-sm bg-background/50 px-3 py-1 rounded-full">
                              Age {char.age}
                            </div>
                          )}
                        </div>
                        
                        {appearance.aesthetic_vibe && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                              {appearance.aesthetic_vibe}
                            </span>
                            {appearance.color_palette && (
                              <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                                {appearance.color_palette}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="p-6 space-y-4">
                        {/* Appearance Section */}
                        {Object.keys(appearance).length > 0 && (
                          <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-4 rounded-lg">
                            <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                              <Sparkles className="h-4 w-4" />
                              Visual Identity
                            </h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              {appearance.clothing_style && (
                                <div>
                                  <span className="text-muted-foreground">Style:</span>
                                  <p className="font-medium">{appearance.clothing_style}</p>
                                </div>
                              )}
                              {appearance.makeup_style && (
                                <div>
                                  <span className="text-muted-foreground">Makeup:</span>
                                  <p className="font-medium">{appearance.makeup_style}</p>
                                </div>
                              )}
                              {appearance.hair_style && (
                                <div>
                                  <span className="text-muted-foreground">Hair:</span>
                                  <p className="font-medium">{appearance.hair_style}</p>
                                </div>
                              )}
                              {appearance.signature_accessories && (
                                <div>
                                  <span className="text-muted-foreground">Accessories:</span>
                                  <p className="font-medium">{appearance.signature_accessories}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Drama Hooks */}
                        {dramaHooks.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-destructive mb-2">⚡ Drama Hooks</h4>
                            <div className="flex flex-wrap gap-2">
                              {dramaHooks.map((hook: string, i: number) => (
                                <span key={i} className="text-xs bg-destructive/10 text-destructive px-3 py-1 rounded-full border border-destructive/20">
                                  {hook}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Emotional Tags */}
                        {emotionalTags.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-accent mb-2">🎭 Emotional Range</h4>
                            <div className="flex flex-wrap gap-2">
                              {emotionalTags.map((tag: string, i: number) => (
                                <span key={i} className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Core Details */}
                        <div className="space-y-3 pt-2 border-t border-border">
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

                        {/* Relationships */}
                        {char.relationships && char.relationships.length > 0 && (
                          <div className="pt-3 border-t border-border">
                            <h4 className="font-semibold mb-2">🔗 Relationships</h4>
                            <div className="space-y-2">
                              {char.relationships.map((rel: any, i: number) => (
                                <div key={i} className="text-sm bg-background/50 p-2 rounded">
                                  <span className="font-medium">{rel.character}</span>
                                  <span className="text-muted-foreground"> • {rel.type}</span>
                                  {rel.description && (
                                    <p className="text-xs text-muted-foreground mt-1">{rel.description}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <Button 
                          className="w-full mt-4 bg-gradient-to-r from-primary to-accent"
                          onClick={() => navigate(`/episodes?projectId=${char.project_id}&characterId=${char.id}`)}
                        >
                          Generate Episode with {char.name}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Characters;
