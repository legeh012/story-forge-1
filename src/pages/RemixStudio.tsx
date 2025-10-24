import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Play } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { EpisodeVideoPlayer } from "@/components/EpisodeVideoPlayer";

export default function RemixStudio() {
  const [episode, setEpisode] = useState("");
  const [cast, setCast] = useState("");
  const [music, setMusic] = useState("");
  const [overlay, setOverlay] = useState("");
  const [remixable, setRemixable] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const handleGenerate = async () => {
    if (!episode) {
      toast.error("Please enter an episode name");
      return;
    }

    setIsGenerating(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to generate videos");
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-remix-video', {
        body: {
          episode,
          cast,
          music,
          overlay,
          remixable
        }
      });

      if (error) throw error;

      setVideoUrl(data.videoUrl);
      setIsPlayerOpen(true);
      toast.success("Video generated and stored in Remix Vault! 🎬");
      
      console.log('Remix generated:', {
        vaultId: data.vaultId,
        videoUrl: data.videoUrl,
        metadata: data.remixMetadata
      });
    } catch (error) {
      console.error("Video generation error:", error);
      toast.error("Failed to generate video");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Remix Studio - StoryForge Video Generator"
        description="Generate AI-powered reality TV episodes with custom cast, music, and overlays"
      />
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">Remix Studio</h1>
            <p className="text-muted-foreground">
              Generate AI-powered reality TV episodes with custom overlays and music
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Video Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="episode">Episode Name</Label>
                <Input
                  id="episode"
                  placeholder="Enter episode name or description"
                  value={episode}
                  onChange={(e) => setEpisode(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cast">Cast Selection</Label>
                <Select value={cast} onValueChange={setCast}>
                  <SelectTrigger id="cast">
                    <SelectValue placeholder="Select cast members" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lucky">Lucky (DJ Luck Luck)</SelectItem>
                    <SelectItem value="full-cast">Full Cast</SelectItem>
                    <SelectItem value="main-drama">Main Drama Squad</SelectItem>
                    <SelectItem value="confessional">Confessional Mode</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="music">Music Track</Label>
                <Select value={music} onValueChange={setMusic}>
                  <SelectTrigger id="music">
                    <SelectValue placeholder="Select Suno track" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="say-less">Say Less</SelectItem>
                    <SelectItem value="better-than-you">Better Than You</SelectItem>
                    <SelectItem value="youre-a-hater">You're a Hater</SelectItem>
                    <SelectItem value="all-out-of-love">All Out of Love</SelectItem>
                    <SelectItem value="hot-sauce">Hot Sauce</SelectItem>
                    <SelectItem value="low-key-bussin">Low Key Bussin</SelectItem>
                    <SelectItem value="do-need-half-way-love">Do Need Half Way Love</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="overlay">Overlay Style</Label>
                <Select value={overlay} onValueChange={setOverlay}>
                  <SelectTrigger id="overlay">
                    <SelectValue placeholder="Select overlay style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confessional">Confessional Booth</SelectItem>
                    <SelectItem value="cast-reactions">Cast Reactions</SelectItem>
                    <SelectItem value="drama-tags">Drama Tags</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="chaos">Chaos Mode</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remixable"
                  checked={remixable}
                  onCheckedChange={(checked) => setRemixable(checked as boolean)}
                />
                <Label htmlFor="remixable" className="cursor-pointer">
                  Export with remix metadata (JSON schema)
                </Label>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Video...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Generate Video
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <EpisodeVideoPlayer
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
        videoUrl={videoUrl}
        episodeTitle={episode || "Remix Video"}
        autoPlay={true}
      />
    </>
  );
}
