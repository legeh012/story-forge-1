import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Users, 
  BookOpen, 
  Video, 
  CheckCircle2, 
  ArrowRight,
  X
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action: string;
  link: string;
  icon: React.ReactNode;
  completed: boolean;
}

interface OnboardingGuideProps {
  stats: {
    projects: number;
    characters: number;
    episodes: number;
  };
  onDismiss: () => void;
}

export const OnboardingGuide = ({ stats, onDismiss }: OnboardingGuideProps) => {
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'create-project',
      title: 'Create Your First Project',
      description: 'Set up a reality TV show or movie project',
      action: 'Create Project',
      link: '/create',
      icon: <Sparkles className="h-5 w-5" />,
      completed: stats.projects > 0,
    },
    {
      id: 'add-characters',
      title: 'Add Characters',
      description: 'Build your cast with diverse personalities',
      action: 'Add Characters',
      link: '/characters',
      icon: <Users className="h-5 w-5" />,
      completed: stats.characters > 0,
    },
    {
      id: 'generate-episode',
      title: 'Generate First Episode',
      description: 'Use AI to create your first episode with a simple prompt',
      action: 'Generate Episode',
      link: '/episodes',
      icon: <Video className="h-5 w-5" />,
      completed: stats.episodes > 0,
    },
    {
      id: 'explore-features',
      title: 'Explore Advanced Features',
      description: 'Discover AI bots, viral optimization, and analytics',
      action: 'Explore',
      link: '/viral-bots',
      icon: <BookOpen className="h-5 w-5" />,
      completed: false,
    },
  ]);

  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;
  const allCompleted = completedCount === steps.length;

  useEffect(() => {
    setSteps(prev => prev.map(step => ({
      ...step,
      completed: 
        (step.id === 'create-project' && stats.projects > 0) ||
        (step.id === 'add-characters' && stats.characters > 0) ||
        (step.id === 'generate-episode' && stats.episodes > 0) ||
        step.completed
    })));
  }, [stats]);

  if (allCompleted) {
    return (
      <Card className="border-success/50 bg-gradient-to-br from-success/5 to-background relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-success/20">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <div>
              <CardTitle>You're All Set!</CardTitle>
              <CardDescription>
                You've completed the onboarding. Ready to create viral content!
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2"
        onClick={onDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
      <CardHeader>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-primary/20 animate-pulse">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle>Welcome to StoryForge</CardTitle>
            <CardDescription>
              Complete these steps to start creating viral content
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-auto">
            {completedCount}/{steps.length}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center gap-4 p-3 rounded-lg border transition-all ${
              step.completed
                ? 'bg-success/5 border-success/20'
                : 'bg-card border-border hover:border-primary/30'
            }`}
          >
            <div className={`p-2 rounded-lg ${
              step.completed ? 'bg-success/20 text-success' : 'bg-primary/10 text-primary'
            }`}>
              {step.completed ? <CheckCircle2 className="h-5 w-5" /> : step.icon}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{step.title}</h4>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
            {!step.completed && (
              <Link to={step.link}>
                <Button size="sm" className="whitespace-nowrap">
                  {step.action}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
