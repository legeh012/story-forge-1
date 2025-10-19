import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ArrowRight, Sparkles, Film, Megaphone, Image as ImageIcon } from "lucide-react";
import Navigation from "@/components/Navigation";
import { z } from "zod";

const projectSchema = z.object({
  title: z.string().trim().min(1, "Project name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().trim().max(500, "Description must be less than 500 characters").optional(),
  genre: z.string().optional(),
  mood: z.string().optional(),
  theme: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

const CreateProject = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    description: "",
    genre: "",
    mood: "",
    theme: "",
  });

  const [contentType, setContentType] = useState("");
  const [platform, setPlatform] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [duration, setDuration] = useState("");
  const [styleReference, setStyleReference] = useState("");

  const handleInputChange = (field: keyof ProjectFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 1) {
      try {
        projectSchema.pick({ title: true, description: true }).parse({
          title: formData.title,
          description: formData.description,
        });
        setStep(2);
      } catch (error) {
        if (error instanceof z.ZodError) {
          toast({
            title: "Validation Error",
            description: error.errors[0].message,
            variant: "destructive",
          });
        }
      }
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      projectSchema.parse(formData);
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to create a project",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { error } = await supabase.from("projects").insert({
        title: formData.title,
        description: formData.description || null,
        genre: formData.genre || null,
        mood: formData.mood || null,
        theme: formData.theme || null,
        user_id: user.id,
        status: "draft",
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your project has been created successfully",
      });

      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center">
          <div
            className={`h-2 w-2 rounded-full transition-all ${
              i === step
                ? "bg-primary w-8"
                : i < step
                ? "bg-primary/50"
                : "bg-muted"
            }`}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary">AI Content Creation</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Create Your Project
            </h1>
            <p className="text-muted-foreground text-lg">
              Let's bring your vision to life in just a few steps
            </p>
          </div>

          {renderStepIndicator()}

          <Card className="p-8 bg-card/50 backdrop-blur-sm border-border animate-slide-up">
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <Film className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Basic Information</h2>
                  <p className="text-muted-foreground">Tell us about your project</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Project Name *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., My Viral Ad Campaign"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      className="bg-background/50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="What's your project about? Describe your vision..."
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      className="bg-background/50 min-h-32"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contentType">Content Type</Label>
                    <Select value={contentType} onValueChange={setContentType}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select content type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="movie">Movie / Short Film</SelectItem>
                        <SelectItem value="ad">Advertisement</SelectItem>
                        <SelectItem value="reality">Reality Show</SelectItem>
                        <SelectItem value="animation">Animation</SelectItem>
                        <SelectItem value="documentary">Documentary</SelectItem>
                        <SelectItem value="social">Social Media Content</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <Megaphone className="h-12 w-12 text-accent mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Style & Genre</h2>
                  <p className="text-muted-foreground">Define the aesthetic and feel</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="genre">Genre</Label>
                    <Select value={formData.genre} onValueChange={(value) => handleInputChange("genre", value)}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="action">Action</SelectItem>
                        <SelectItem value="comedy">Comedy</SelectItem>
                        <SelectItem value="drama">Drama</SelectItem>
                        <SelectItem value="horror">Horror</SelectItem>
                        <SelectItem value="scifi">Sci-Fi</SelectItem>
                        <SelectItem value="fantasy">Fantasy</SelectItem>
                        <SelectItem value="thriller">Thriller</SelectItem>
                        <SelectItem value="romance">Romance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="mood">Mood</Label>
                    <Select value={formData.mood} onValueChange={(value) => handleInputChange("mood", value)}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select mood" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uplifting">Uplifting</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="mysterious">Mysterious</SelectItem>
                        <SelectItem value="energetic">Energetic</SelectItem>
                        <SelectItem value="calm">Calm</SelectItem>
                        <SelectItem value="intense">Intense</SelectItem>
                        <SelectItem value="whimsical">Whimsical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <Input
                      id="theme"
                      placeholder="e.g., Coming of age, Redemption"
                      value={formData.theme}
                      onChange={(e) => handleInputChange("theme", e.target.value)}
                      className="bg-background/50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="styleReference">Style Reference</Label>
                    <Select value={styleReference} onValueChange={setStyleReference}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Visual style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cinematic">Cinematic</SelectItem>
                        <SelectItem value="documentary">Documentary</SelectItem>
                        <SelectItem value="animated">Animated</SelectItem>
                        <SelectItem value="minimalist">Minimalist</SelectItem>
                        <SelectItem value="vibrant">Vibrant</SelectItem>
                        <SelectItem value="retro">Retro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <ImageIcon className="h-12 w-12 text-primary-glow mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Platform & Audience</h2>
                  <p className="text-muted-foreground">Where will your content shine?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="platform">Target Platform</Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="instagram">Instagram Reels</SelectItem>
                        <SelectItem value="youtube-shorts">YouTube Shorts</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="streaming">Streaming (Netflix/Prime)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="duration">Desired Length</Label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15s">15 seconds</SelectItem>
                        <SelectItem value="30s">30 seconds</SelectItem>
                        <SelectItem value="60s">60 seconds</SelectItem>
                        <SelectItem value="3min">3 minutes</SelectItem>
                        <SelectItem value="5min">5 minutes</SelectItem>
                        <SelectItem value="10min">10+ minutes</SelectItem>
                        <SelectItem value="30min">30+ minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="audience">Target Audience</Label>
                    <Select value={targetAudience} onValueChange={setTargetAudience}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Who is this for?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gen-z">Gen Z (18-24)</SelectItem>
                        <SelectItem value="millennials">Millennials (25-40)</SelectItem>
                        <SelectItem value="gen-x">Gen X (41-56)</SelectItem>
                        <SelectItem value="all">All Ages</SelectItem>
                        <SelectItem value="teens">Teens (13-17)</SelectItem>
                        <SelectItem value="professionals">Professionals</SelectItem>
                        <SelectItem value="parents">Parents</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-6">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI-Powered Features
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Automatic script generation from your inputs</li>
                    <li>• Smart scene and storyboard creation</li>
                    <li>• Platform-optimized formatting</li>
                    <li>• Viral potential analysis</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={step === 1 || isLoading}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              {step < 3 ? (
                <Button onClick={handleNext} className="gap-2 bg-gradient-to-r from-primary to-accent">
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  disabled={isLoading}
                  className="gap-2 bg-gradient-to-r from-primary to-accent"
                >
                  {isLoading ? "Creating..." : "Create Project"}
                  <Sparkles className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;
