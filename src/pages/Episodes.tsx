import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BookOpen, Sparkles, Wand2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

const Episodes = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setLoading(false);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate('/auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-accent to-primary-glow bg-clip-text text-transparent">
              Create New Episode
            </h1>
            <p className="text-muted-foreground text-lg">
              Craft compelling episodic content with AI-powered narrative assistance
            </p>
          </div>

          <Card className="p-8 bg-card border-border">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <Wand2 className="h-6 w-6 text-accent" />
                <div>
                  <h2 className="text-xl font-semibold">AI Episode Generator</h2>
                  <p className="text-sm text-muted-foreground">Describe your episode and let AI create it</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Textarea 
                  placeholder="Example: Create episode 3 of season 1 where the main character discovers a hidden door in the library that leads to an alternate dimension..."
                  className="bg-background border-border min-h-48 resize-none"
                />
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-accent to-primary hover:opacity-90 transition-opacity"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Episode
              </Button>
            </div>
          </Card>

          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Episode Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 bg-card border-border hover:border-accent/30 transition-all">
                <h3 className="font-semibold mb-2">Character Continuity</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically maintain character traits and relationships from previous episodes
                </p>
              </Card>
              <Card className="p-4 bg-card border-border hover:border-primary/30 transition-all">
                <h3 className="font-semibold mb-2">Plot Consistency</h3>
                <p className="text-sm text-muted-foreground">
                  AI ensures storylines remain coherent across your narrative
                </p>
              </Card>
              <Card className="p-4 bg-card border-border hover:border-primary-glow/30 transition-all">
                <h3 className="font-semibold mb-2">Multi-Format Export</h3>
                <p className="text-sm text-muted-foreground">
                  Deploy to web, mobile, AR/VR, and more platforms seamlessly
                </p>
              </Card>
              <Card className="p-4 bg-card border-border hover:border-accent/30 transition-all">
                <h3 className="font-semibold mb-2">Media Generation</h3>
                <p className="text-sm text-muted-foreground">
                  Generate videos, images, and animations that match your story
                </p>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Episodes;
