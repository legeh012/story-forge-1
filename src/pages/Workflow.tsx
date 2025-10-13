import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare, FileText, Video, Palette, Share2, TrendingUp, Check } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const workflowSteps = [
  {
    id: 1,
    title: "Idea Input",
    subtitle: "Genre, mood, theme, or product description",
    icon: MessageSquare,
    color: "from-primary to-primary-glow",
    description: "Start with your creative vision"
  },
  {
    id: 2,
    title: "Script & Storyboard Generation",
    subtitle: "AI-powered narrative structure",
    icon: FileText,
    color: "from-accent to-primary",
    description: "Let AI craft your story framework"
  },
  {
    id: 3,
    title: "Scene Creation & Development",
    subtitle: "Build immersive experiences",
    icon: Video,
    color: "from-primary-glow to-accent",
    description: "Develop detailed scenes and interactions"
  },
  {
    id: 4,
    title: "Character Integration",
    subtitle: "Persistent character system",
    icon: Palette,
    color: "from-accent to-primary-glow",
    description: "Add characters with continuity"
  },
  {
    id: 5,
    title: "Social Media & Publishing",
    subtitle: "Cross-platform deployment",
    icon: Share2,
    color: "from-primary to-accent",
    description: "Deploy to all platforms"
  },
  {
    id: 6,
    title: "Growth & Analytics",
    subtitle: "Track performance and engagement",
    icon: TrendingUp,
    color: "from-primary-glow to-primary",
    description: "Monitor and optimize your content"
  }
];

const Workflow = () => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const navigate = useNavigate();

  const handleStepComplete = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary-glow bg-clip-text text-transparent">
              Your Creative Workflow
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From initial concept to published experience—guided by AI at every step
            </p>
          </div>

          {/* Workflow Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = completedSteps.includes(step.id);
              
              return (
                <Card
                  key={step.id}
                  className={`p-6 bg-card border-border hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden ${
                    isCompleted ? 'border-primary/70' : ''
                  }`}
                  onClick={() => handleStepComplete(step.id)}
                >
                  {/* Step Number Badge */}
                  <div className="absolute top-4 right-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isCompleted 
                        ? 'bg-primary text-white' 
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {isCompleted ? <Check className="h-4 w-4" /> : step.id}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${step.color} w-fit mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{step.subtitle}</p>
                  <p className="text-xs text-foreground/60">{step.description}</p>

                  {/* Connection Line */}
                  {index < workflowSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 transform translate-x-full">
                      <ArrowRight className="h-6 w-6 text-primary/30" />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Interactive Flow Diagram */}
          <Card className="p-8 bg-gradient-to-br from-card to-card/50 border-primary/20 mb-8">
            <h2 className="text-3xl font-bold mb-6 text-center">How It Works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Multi-Modal Input</h3>
                    <p className="text-sm text-muted-foreground">
                      Express your ideas through text, voice, images, or sketches—AI understands it all
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-accent/5 rounded-xl border border-accent/20">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Video className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">AI Content Generation</h3>
                    <p className="text-sm text-muted-foreground">
                      Advanced AI creates scripts, storyboards, and media that align with your narrative
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-primary-glow/5 rounded-xl border border-primary-glow/20">
                  <div className="p-2 rounded-lg bg-primary-glow/10">
                    <Palette className="h-5 w-5 text-primary-glow" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Character Continuity</h3>
                    <p className="text-sm text-muted-foreground">
                      Characters remember traits, relationships, and history across all episodes
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-accent/5 rounded-xl border border-accent/20">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <FileText className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Episodic Storytelling</h3>
                    <p className="text-sm text-muted-foreground">
                      Generate subsequent episodes while maintaining perfect narrative consistency
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Share2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Cross-Platform Deploy</h3>
                    <p className="text-sm text-muted-foreground">
                      Publish to iOS, Android, web, and AR/VR with a single click
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-primary-glow/5 rounded-xl border border-primary-glow/20">
                  <div className="p-2 rounded-lg bg-primary-glow/10">
                    <TrendingUp className="h-5 w-5 text-primary-glow" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Growth Analytics</h3>
                    <p className="text-sm text-muted-foreground">
                      Track engagement, optimize content, and grow your audience
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* CTA Section */}
          <div className="text-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-lg px-8"
              onClick={() => navigate("/dashboard")}
            >
              Start Your First Project
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Complete {completedSteps.length} of {workflowSteps.length} steps
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Workflow;
