import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Sparkles } from "lucide-react";

const Characters = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Create New Character
            </h1>
            <p className="text-muted-foreground text-lg">
              Build persistent characters that evolve across your stories
            </p>
          </div>

          <Card className="p-8 bg-card border-border">
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Character Name</Label>
                <Input 
                  id="name" 
                  placeholder="Elena Storm"
                  className="bg-background border-border"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input 
                    id="role" 
                    placeholder="Protagonist"
                    className="bg-background border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input 
                    id="age" 
                    type="number"
                    placeholder="28"
                    className="bg-background border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="personality">Personality Traits</Label>
                <Textarea 
                  id="personality"
                  placeholder="Brave, compassionate, quick-witted..."
                  className="bg-background border-border min-h-24"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="background">Background Story</Label>
                <Textarea 
                  id="background"
                  placeholder="Born in the coastal city of Meridian, Elena grew up..."
                  className="bg-background border-border min-h-32"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goals">Goals & Motivations</Label>
                <Textarea 
                  id="goals"
                  placeholder="Seeks to uncover the truth about..."
                  className="bg-background border-border min-h-24"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Character
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  className="border-primary/50 hover:bg-primary/10"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Assist
                </Button>
              </div>
            </form>
          </Card>

          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">AI-Powered Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 bg-card border-border hover:border-primary/30 transition-all">
                <h3 className="font-semibold mb-2">Character Evolution</h3>
                <p className="text-sm text-muted-foreground">
                  Track how your character develops across episodes
                </p>
              </Card>
              <Card className="p-4 bg-card border-border hover:border-accent/30 transition-all">
                <h3 className="font-semibold mb-2">Relationship Mapping</h3>
                <p className="text-sm text-muted-foreground">
                  Visualize connections between characters
                </p>
              </Card>
              <Card className="p-4 bg-card border-border hover:border-primary-glow/30 transition-all">
                <h3 className="font-semibold mb-2">Voice Consistency</h3>
                <p className="text-sm text-muted-foreground">
                  Maintain authentic character voice throughout
                </p>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Characters;
